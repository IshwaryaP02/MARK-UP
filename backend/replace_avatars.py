import os
import re

FRONTEND_DIR = r"D:\MARKUP\FRONTEND\src"

def add_import(content, file_path):
    # Determine path to Avatar
    depth = file_path.replace(FRONTEND_DIR, "").count(os.sep) - 1
    if depth <= 0:
        import_path = "./components/common/Avatar"
    else:
        import_path = "../" * depth + "common/Avatar"
    
    if "import { Avatar }" not in content:
        # Find last import
        imports = list(re.finditer(r"^import .*?;?$", content, re.MULTILINE))
        if imports:
            last_import = imports[-1]
            return content[:last_import.end()] + f"\nimport {{ Avatar }} from '{import_path}';" + content[last_import.end():]
    return content

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Search for <img src={something || 'unsplash'} alt={name} className={classes} />
    # We will use a regex to match the img tag
    pattern = re.compile(
        r'<img\s+src=\{([^|}]+)\|\|\s*\'https://images\.unsplash\.com/[^\']+\'\}\s+alt=\{([^\}]+)\}\s+className="([^"]+)"\s*/>',
        re.DOTALL
    )

    def replace_match(match):
        src_var = match.group(1).strip()
        name_var = match.group(2).strip()
        classes = match.group(3).strip()
        
        # Decide size based on w- h- classes
        size = "md"
        if "w-10" in classes or "w-12" in classes or "w-14" in classes:
            size = "lg"
        elif "w-20" in classes or "w-24" in classes:
            size = "xl"
        elif "w-6" in classes or "w-7" in classes:
            size = "sm"
            
        # strip standard ring and rounded classes that Avatar handles
        classes = classes.replace("rounded-full", "").replace("rounded-lg", "").replace("rounded-2xl", "")
        classes = classes.replace("object-cover", "")
        classes = re.sub(r'w-\d+ h-\d+', '', classes)
        classes = classes.strip()
        
        class_prop = f' className="{classes}"' if classes else ''
        return f'<Avatar name={{{name_var}}} src={{{src_var}}} size="{size}"{class_prop} />'

    new_content, count = pattern.subn(replace_match, content)
    
    if count > 0:
        new_content = add_import(new_content, file_path)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Replaced {count} instances in {file_path}")

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith(".tsx") and file != "Avatar.tsx" and file != "Navbar.tsx" and file != "StudentProfile.tsx":
            process_file(os.path.join(root, file))

print("Done")
