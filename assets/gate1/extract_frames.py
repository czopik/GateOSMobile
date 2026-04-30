import cv2
import numpy as np
from PIL import Image
from rembg import remove
import os

# Configuration
video_path = "Generowanie_Wideo_Na_Żądanie.mp4"
output_dir = "frames"
target_fps = 30  # Extract 30 frames per second for smooth animation
quality = 95  # PNG quality (0-100, higher is better)

# Create output directory
os.makedirs(output_dir, exist_ok=True)

# Open video
cap = cv2.VideoCapture(video_path)

# Get video properties
original_fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / original_fps

print(f"Video info:")
print(f"- Original FPS: {original_fps:.2f}")
print(f"- Total frames: {total_frames}")
print(f"- Duration: {duration:.2f}s")
print(f"- Target FPS: {target_fps}")
print(f"- Expected output frames: {int(duration * target_fps)}")

# Calculate frame interval
frame_interval = max(1, int(original_fps / target_fps))

frame_count = 0
saved_count = 0

print("\nExtracting frames...")

while cap.isOpened():
    ret, frame = cap.read()
    
    if not ret:
        break
    
    # Save frame at the specified interval
    if frame_count % frame_interval == 0:
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Remove background using rembg
        print(f"Processing frame {saved_count + 1}...", end='\r')
        result = remove(Image.fromarray(frame_rgb))
        
        # Save as PNG with transparency
        output_path = os.path.join(output_dir, f"gate_{saved_count:04d}.png")
        result.save(output_path, 'PNG', optimize=True, quality=quality)
        
        saved_count += 1
    
    frame_count += 1

cap.release()

print(f"\n\nCompleted!")
print(f"- Total frames processed: {frame_count}")
print(f"- Frames saved: {saved_count}")
print(f"- Output directory: {output_dir}")
