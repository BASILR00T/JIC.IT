import os
import re

# Precise pattern for the banner
banner_pattern = re.compile(r'\s*<div\s+style="background: linear-gradient\(90deg, #8b5cf6 0%, #3b82f6 100%\);.*?ركز في اختبارك الآن.*?</div>', re.DOTALL)

updated_count = 0
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = banner_pattern.sub('', content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {path}")
                    updated_count += 1
            except Exception as e:
                print(f"Error processing {path}: {e}")

print(f"Total files updated: {updated_count}")
