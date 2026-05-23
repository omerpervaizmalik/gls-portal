import urllib.request
import xml.etree.ElementTree as ET
import json
import os

url = "https://www.youtube.com/feeds/videos.xml?channel_id=UCWoBMwkNk4wwLb2MD5Va26A"
headers = {
    'User-Agent': 'Mozilla/5.0'
}

req = urllib.request.Request(url, headers=headers)
try:
    print("Fetching YouTube RSS XML feed...")
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
        
    print("Parsing XML data...")
    root = ET.fromstring(xml_data)
    
    # Namespaces
    ns = {
        'atom': 'http://www.w3.org/2005/Atom',
        'yt': 'http://www.youtube.com/xml/schemas/2015',
        'media': 'http://search.yahoo.com/mrss/'
    }
    
    videos = []
    # Find all entry elements
    for entry in root.findall('atom:entry', ns):
        video_id = entry.find('yt:videoId', ns).text
        title = entry.find('atom:title', ns).text
        published = entry.find('atom:published', ns).text
        
        # Get description and views if available
        media_group = entry.find('media:group', ns)
        description = "Watch this detailed guide directly on our YouTube channel for courtroom and legal guidance in Pakistan."
        if media_group is not None:
            desc_elem = media_group.find('media:description', ns)
            if desc_elem is not None and desc_elem.text:
                description = desc_elem.text.strip()
                # Limit length
                if len(description) > 300:
                    description = description[:297] + "..."
                    
        # Format date
        # published is like "2026-05-19T12:00:00+00:00" -> "May 19, 2026"
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(published.replace('Z', '+00:00'))
            date_str = dt.strftime('%B %d, %Y')
        except:
            date_str = "Recent Upload"
            
        videos.append({
            "title": title,
            "youtubeId": video_id,
            "date": date_str,
            "description": description
        })
        
    print(f"SUCCESS: Parsed {len(videos)} real videos from feed.")
    
    if len(videos) > 0:
        formatted_db = "const law_untold_db = [\n"
        for i, video in enumerate(videos):
            # Classify category
            lower = video['title'].lower()
            if any(k in lower for k in ['police', 'fir', 'criminal', 'crpc', 'cpc', 'arrest', 'court', 'duties', 'ahlmad', 'trial', 'remand', 'cheque', '489f']):
                category = "Criminal Law & Procedures"
            elif any(k in lower for k in ['lawyer', 'earn', 'career', 'chamber', 'junior', 'practice', 'mentorship', 'office']):
                category = "Career Development"
            else:
                category = "Practical Skills"
                
            # Build key takeaways based on title content
            takeaways = [
                "Real-world application under Pakistan penal and procedural codes.",
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
                f'        "duration": "Watch",\n'
                f'        "views": "Active Guide",\n'
                f'        "description": {json.dumps(video["description"])},\n'
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
        print(f"Successfully wrote {len(videos)} real videos to {target_path}")
    else:
        print("ERROR: No videos parsed from XML.")
except Exception as e:
    print(f"Error fetching or parsing RSS: {e}")
