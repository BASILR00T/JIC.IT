import os
import json
import re
import requests

# Supabase Credentials from config.js
SUPABASE_URL = "https://rseukxeqmkhgjiomhumt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXVreGVxbWtoZ2ppb21odW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTMxMjMsImV4cCI6MjA4NTc4OTEyM30.bG56KlNzCzA3UDS0vlLIyepogvdkfvOm7-bPWdQ-CsQ"

def html_to_md(html):
    # 1. Extract Main Content
    main_match = re.search(r'<main.*?>(.*?)</main>', html, re.DOTALL)
    if main_match:
        content = main_match.group(1)
    else:
        body_match = re.search(r'<body.*?>(.*?)</body>', html, re.DOTALL)
        content = body_match.group(1) if body_match else html

    # Remove template clutter
    content = re.sub(r'<nav.*?>.*?</nav>', '', content, flags=re.DOTALL)
    content = re.sub(r'<header class="main-header">.*?</header>', '', content, flags=re.DOTALL)
    content = re.sub(r'<footer.*?>.*?</footer>', '', content, flags=re.DOTALL)
    content = re.sub(r'<a href=".*?" class="back-button">.*?</a>', '', content)
    content = re.sub(r'<script.*?>.*?</script>', '', content, flags=re.DOTALL)
    
    # We leave the rest of the HTML (divs, pres, codes, warnings) UNTOUCHED.
    # We only clean up the outer H1 which is often the page title we extract separately.
    content = re.sub(r'<h1.*?>(.*?)</h1>', r'', content, count=1) 

    # --- THE FIX: DEDENT ---
    # Markdown treats lines indented with 4+ spaces as code blocks.
    # We must remove the common leading indentation from the extracted HTML.
    import textwrap
    content = textwrap.dedent(content)

    return content.strip()

def ingest():
    print("🚀 Starting High-Fidelity Content Ingestion...")
    
    with open('modules.json', 'r', encoding='utf-8') as f:
        modules = json.load(f)

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    # Clean slate: Wipe everything to ensure perfect order and formatting
    print("🧹 Cleaning existing lessons...")
    # Using 'is_not.null' is a reliable way to target all rows in PostgREST
    del_resp = requests.delete(f"{SUPABASE_URL}/rest/v1/lessons?slug=not.is.null", headers=headers)
    if del_resp.status_code >= 400:
        print(f"  ⚠️ Delete failed: {del_resp.status_code} {del_resp.text}")
        print("  Switching to UPSERT mode instead...")
        headers["Prefer"] = "resolution=merge-duplicates"

    total_lessons = 0
    for mod in modules:
        mod_id = mod['id']
        base_dir = os.path.dirname(mod['link'])
        if not base_dir or not os.path.exists(base_dir): continue
        
        print(f"\n📂 Processing: {mod['title']}")
        
        for file in os.listdir(base_dir):
            if file.endswith('.html') and file.lower() != 'index.html':
                file_path = os.path.join(base_dir, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()

                title_match = re.search(r'<title>(.*?)</title>', html_content)
                title = title_match.group(1).split('|')[0].strip() if title_match else file.replace('.html', '')
                
                slug = f"{mod_id}-{file.replace('.html', '').lower()}"
                markdown = html_to_md(html_content)
                
                # Video extraction
                video_match = re.search(r'src="https://www.youtube.com/embed/(.*?)"', html_content)
                video_url = f"https://www.youtube.com/watch?v={video_match.group(1)}" if video_match else None

                lesson_data = {
                    "module_id": mod_id,
                    "slug": slug,
                    "title": title,
                    "content_md": markdown,
                    "video_url": video_url
                }

                resp = requests.post(f"{SUPABASE_URL}/rest/v1/lessons", headers=headers, json=lesson_data)
                
                if resp.status_code in [200, 201]:
                    print(f"  ✅ {title}")
                    total_lessons += 1
                else:
                    print(f"  ❌ {title} - {resp.status_code} {resp.text}")

    print(f"\n✨ Done! Total Ingested: {total_lessons}")

if __name__ == "__main__":
    ingest()
