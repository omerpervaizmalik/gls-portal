import os
import subprocess
import json
import sys

def install_and_import(package):
    try:
        __import__(package)
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

install_and_import('yt_dlp')
import yt_dlp

channel_url = "https://www.youtube.com/@LawUntold/videos"

ydl_opts = {
    'extract_flat': True,
    'quiet': True,
}

print("Fetching all video metadata from the channel using yt-dlp (this may take a moment)...")

videos = []
try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(channel_url, download=False)
        
        if 'entries' in info:
            for entry in info['entries']:
                # The entry is a dict with video metadata
                video_id = entry.get('id')
                title = entry.get('title')
                duration_sec = entry.get('duration')
                view_count = entry.get('view_count')
                
                # Format duration
                duration_str = "Watch"
                if duration_sec:
                    mins, secs = divmod(int(duration_sec), 60)
                    if mins >= 60:
                        hrs, mins = divmod(mins, 60)
                        duration_str = f"{hrs}:{mins:02d}:{secs:02d}"
                    else:
                        duration_str = f"{mins}:{secs:02d}"
                        
                # Format views
                views_str = "YouTube Video"
                if view_count:
                    if view_count >= 1000000:
                        views_str = f"{view_count/1000000:.1f}M views"
                    elif view_count >= 1000:
                        views_str = f"{view_count/1000:.1f}K views"
                    else:
                        views_str = f"{view_count} views"
                        
                videos.append({
                    "title": title,
                    "youtubeId": video_id,
                    "duration": duration_str,
                    "views": views_str,
                    "date": "Recent Upload" # yt-dlp flat extract might not have exact upload date
                })
                
    print(f"SUCCESS: Extracted {len(videos)} videos!")
    
    if len(videos) > 0:
        formatted_db = "const law_untold_db = [\n"
        for i, video in enumerate(videos):
            # Classify category
            lower = video['title'].lower() if video['title'] else ""
            if any(k in lower for k in ['police', 'fir', 'criminal', 'crpc', 'cpc', 'arrest', 'court', 'duties', 'ahlmad', 'trial', 'remand', 'cheque', '489f']):
                category = "Criminal Law & Procedures"
            elif any(k in lower for k in ['lawyer', 'earn', 'career', 'chamber', 'junior', 'practice', 'mentorship', 'office']):
                category = "Career Development"
            else:
                category = "Practical Skills"
                
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
        print("ERROR: No videos were extracted.")
        
except Exception as e:
    print(f"An error occurred: {e}")
