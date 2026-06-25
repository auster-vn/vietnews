import json
import subprocess
import os

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(project_root, "vietnews.json")
    run_js_path = os.path.join(project_root, "renderer", "dist", "run.js")
    
    if not os.path.exists(json_path):
        print(f"JSON database not found at {json_path}")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    rendered_articles = [item for item in data if item.get("is_rendered")]
    print(f"Found {len(rendered_articles)} rendered articles to regenerate...")
    
    for item in rendered_articles:
        article_id = item["id"]
        title = item["title"]
        print(f"Regenerating PNG for: {title} ({article_id})")
        
        # Execute TS renderer subprocess for this specific UUID
        result = subprocess.run(
            ["node", run_js_path, "--id", article_id],
            cwd=project_root,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("  -> Success")
        else:
            print(f"  -> Failed: {result.stderr}")

if __name__ == "__main__":
    main()
