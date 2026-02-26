import subprocess
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

base = "https://cfvod.kaltura.com/scf/hls/p/2323111/sp/232311100/serveFlavor/entryId/1_3cw5loe0/v/1/ev/4/flavorId/1_z0b0rcve/name/a.mp4/seg-###-v1-a1.ts?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZnZvZC5rYWx0dXJhLmNvbS9zY2YvaGxzL3AvMjMyMzExMS9zcC8yMzIzMTExMDAvc2VydmVGbGF2b3IvZW50cnlJZC8xXzNjdzVsb2UwL3YvMS9ldi80L2ZsYXZvcklkLzFfejBiMHJjdmUvbmFtZS9hLm1wNC8qIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzYxMTEyNTE3fX19XX0_&Signature=XzRl51ri05hq2Z8iibXO~gcYXA80F7TABC8EAA~064Fi4FZVyN0lc9ZX5DYNhToGhb8P9QAk5awcTa0hCII4qzjYLuC5aHYgucLrjT11aJBkvENGwJPBeI7Pv4L-Eh42nMOfDznFG4V6y323Ttp-4EMxvNL4Cfrc7ose3dKayg4I-GQ4eAbsiUQ~MOjdjqL3H7nzACznizR0XhoW1a3Mrw69Ck6lJqWc5HNykbKI0X05miVdcMP45fhRo0h874Di2KESisMBYCfDEWf8jzgCsjalTMnTGGTCkP8KVHDzPAa5yi0x-Bntsh5SVpSAwg4iqkJGU7ZuLs~lIttIbvz0Jw__&Key-Pair-Id=APKAJT6QIWSKVYK3V34A"

def segment_exists(segment_num):
    url = base.replace("###", str(segment_num))
    try:
        urllib.request.urlopen(url)
        return True
    except urllib.error.HTTPError:
        return False


def find_max_segment(start):
    print(f"Finding maximum segment number starting from {start} using binary search...")
    
    if not segment_exists(start):
        return start - 1
    
    left = start
    right = start * 2
    
    while segment_exists(right):
        print(f"Binary search: checking segment {right}... exists, doubling")
        left = right
        right = right * 2
    
    while left < right:
        mid = (left + right + 1) // 2
        print(f"Binary search: checking segment {mid}...")
        if segment_exists(mid):
            left = mid
        else:
            right = mid - 1
    
    return left


def download_segment(segment_num, output_dir):
    url = base.replace("###", str(segment_num))
    output_file = output_dir / f"seg-{segment_num:03d}.ts"
    urllib.request.urlretrieve(url, output_file)
    return segment_num


def download_segments(start, end, max_workers=10):
    output_dir = Path("segments")
    output_dir.mkdir(exist_ok=True)
    
    total = end - start + 1
    print(f"Downloading {total} segments ({start} to {end}) in parallel with {max_workers} workers...")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(download_segment, i, output_dir): i for i in range(start, end + 1)}
        completed = 0
        for future in as_completed(futures):
            segment_num = future.result()
            completed += 1
            print(f"Downloaded segment {segment_num} ({completed}/{total})")
    
    return output_dir


def merge_and_convert(segments_dir):
    print("Merging segments...")
    merged_file = Path("merged.ts")
    
    segment_files = sorted(segments_dir.glob("*.ts"))
    with open(merged_file, "wb") as outfile:
        for seg_file in segment_files:
            with open(seg_file, "rb") as infile:
                outfile.write(infile.read())
    
    print("Converting to MP4...")
    output_mp4 = Path("output.mp4")
    subprocess.run([
        "ffmpeg", "-i", str(merged_file), 
        "-c", "copy", str(output_mp4)
    ], check=True)
    
    print(f"Done! Output saved to {output_mp4}")
    return output_mp4


def main():
    max_segment = find_max_segment(1)
    print(f"Maximum segment found: {max_segment}")
    
    segments_dir = download_segments(1, max_segment)
    merge_and_convert(segments_dir)


if __name__ == "__main__":
    main()
