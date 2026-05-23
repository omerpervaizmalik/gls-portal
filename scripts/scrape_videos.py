import urllib.request
import re
import json
import os

url = "https://www.youtube.com/@LawUntold/videos"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

req = urllib.request.Request(url, headers=headers)
try:
    print("Fetching YouTube page...")
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    print("Parsing HTML...")
    # Find the ytInitialData JSON in the page HTML
    match = re.search(r'var ytInitialData = ({.*?});</script>', html)
    if not match:
        match = re.search(r'window\["ytInitialData"\] = ({.*?});', html)
        
    if match:
        data_str = match.group(1)
        data = json.loads(data_str)
        
        videos = []
        try:
            tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
            videos_tab = None
            for tab in tabs:
                if 'tabRenderer' in tab and tab['tabRenderer'].get('selected', False):
                    videos_tab = tab['tabRenderer']
                    break
            if not videos_tab:
                for tab in tabs:
                    if 'tabRenderer' in tab and 'videos' in tab['tabRenderer'].get('title', '').lower():
                        videos_tab = tab['tabRenderer']
                        break
            
            contents = videos_tab['content']['richGridRenderer']['contents']
            for content in contents:
                if 'richItemRenderer' in content:
                    item = content['richItemRenderer']['content']
                    if 'videoRenderer' in item:
                        video = item['videoRenderer']
                        video_id = video['videoId']
                        title = video['title']['runs'][0]['text']
                        
                        duration = "Watch"
                        if 'lengthText' in video:
                            duration = video['lengthText']['simpleText']
                            
                        views = "YouTube Video"
                        if 'viewCountText' in video and 'simpleText' in video['viewCountText']:
                            views = video['viewCountText']['simpleText']
                        elif 'viewCountText' in video and 'runs' in video['viewCountText']:
                            views = "".join([r['text'] for r in video['viewCountText']['runs']])
                            
                        date = "Recent"
                        if 'publishedTimeText' in video:
                            date = video['publishedTimeText']['simpleText']
                            
                        videos.append({
                            "title": title,
                            "youtubeId": video_id,
                            "duration": duration,
                            "views": views,
                            "date": date
                        })
        except Exception as e:
            print(f"Error traversing JSON structure: {e}")
            
        print(f"SUCCESS: Found {len(videos)} videos.")
        
        # Format the database output
        formatted_db = "const law_untold_db = [\n"
        for i, video in enumerate(videos):
            # Classify category
            lower = video['title'].toLowerCase() if hasattr(video['title'], 'toLowerCase') else video['title'].lower()
            if any(k in lower for k in ['police', 'fir', 'criminal', 'crpc', 'cpc', 'arrest', 'court', 'duties', 'ahlmad', 'trial']):
                category = "Criminal Law & Procedures"
            elif any(k in lower for k in ['lawyer', 'earn', 'career', 'chamber', 'junior', 'practice', 'mentorship', 'office']):
                category = "Career Development"
            else:
                category = "Practical Skills"
                
            # Build key takeaways based on title content
            takeaways = [
                "Real-time visual step-by-step guidance straight from the courtroom guides.",
                "Detailed statutory insights mapped to legal practice rules and processes.",
                "Strategic career takeaways and drafting mentorship points."
            ]
            
            item_str = (
                f"    {{\n"
                f'        "id": "video-{video["youtubeId"]}",\n'
                f'        "title": {json.dumps(video["title"])},\n'
                f'        "youtubeId": "{video["youtubeId"]}",\n'
                f'        "category": "{category}",\n'
                f'        "date": "{video["date"]}",\n'
                f'        "duration": "{video["duration"]}",\n'
                f'        "views": "{video["views"]}",\n'
                f'        "description": "Watch this detailed guide directly on our YouTube channel for courtroom and legal guidance in Pakistan.",\n'
                f'        "keyTakeaways": [\n'
                f'            "Detailed legal explanation and practical courtroom strategies.",\n'
                f'            "Real-world application under Pakistan penal and procedural codes.",\n'
                f'            "Chamber guidance and advocacy skills for young practitioners."\n'
                f'        ]\n'
                f"    }}"
            )
            if i < len(videos) - 1:
                item_str += ","
            formatted_db += item_str + "\n"
        formatted_db += "];\n"
        
        target_path = "d:\\Anti gravity\\get-legal-solution\\law_untold_db.js"
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(formatted_db)
        print(f"Successfully wrote {len(videos)} videos to {target_path}")
        
    else:
        print("ERROR: ytInitialData not found in HTML.")
except Exception as e:
    print(f"Network or parsing error: {e}")
