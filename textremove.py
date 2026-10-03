import os
import shutil

# ==========================================
# CONFIGURATION
# ==========================================

# Main folder containing all your files/folders
SOURCE_FOLDER = r"C:\Users\jnane\Downloads\takeout-20260719T170110Z-1-001\Takeout\Google Photos"

# Folder where everything will be organized
OUTPUT_FOLDER = r"C:\Users\jnane\Downloads\takeout-20260719T170110Z-1-001\images and videos"

# ==========================================
# DESTINATION FOLDERS
# ==========================================

TEXT_FOLDER = os.path.join(OUTPUT_FOLDER, "Text_JSON")
IMAGE_FOLDER = os.path.join(OUTPUT_FOLDER, "Images")
VIDEO_FOLDER = os.path.join(OUTPUT_FOLDER, "Videos")

os.makedirs(TEXT_FOLDER, exist_ok=True)
os.makedirs(IMAGE_FOLDER, exist_ok=True)
os.makedirs(VIDEO_FOLDER, exist_ok=True)

# ==========================================
# FILE EXTENSIONS
# ==========================================

TEXT_EXTENSIONS = {
    ".txt",
    ".json"
}

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tiff",
    ".tif",
    ".webp",
    ".svg",
    ".ico",
    ".heic",
    ".heif",
    ".avif",
    ".raw",
    ".cr2",
    ".cr3",
    ".nef",
    ".arw",
    ".dng",
    ".orf",
    ".rw2"
}

VIDEO_EXTENSIONS = {
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".m4v",
    ".mpeg",
    ".mpg",
    ".3gp",
    ".3g2",
    ".mts",
    ".m2ts",
    ".ts",
    ".vob",
    ".ogv",
    ".rm",
    ".rmvb"
}

# ==========================================
# FUNCTION TO HANDLE DUPLICATE FILE NAMES
# ==========================================

def get_unique_destination(destination_folder, filename):
    destination_path = os.path.join(destination_folder, filename)

    if not os.path.exists(destination_path):
        return destination_path

    name, extension = os.path.splitext(filename)
    counter = 1

    while True:
        new_filename = f"{name}_{counter}{extension}"
        destination_path = os.path.join(
            destination_folder,
            new_filename
        )

        if not os.path.exists(destination_path):
            return destination_path

        counter += 1


# ==========================================
# COUNTERS
# ==========================================

text_count = 0
image_count = 0
video_count = 0
skipped_count = 0

# ==========================================
# RECURSIVELY SEARCH ALL FOLDERS
# ==========================================

for root, dirs, files in os.walk(SOURCE_FOLDER):

    # Prevent scanning the output folder if it is inside SOURCE_FOLDER
    dirs[:] = [
        d for d in dirs
        if os.path.abspath(os.path.join(root, d))
        != os.path.abspath(OUTPUT_FOLDER)
    ]

    for filename in files:

        extension = os.path.splitext(filename)[1].lower()

        source_path = os.path.join(root, filename)

        # --------------------------
        # TXT / JSON
        # --------------------------

        if extension in TEXT_EXTENSIONS:
            destination_folder = TEXT_FOLDER
            text_count += 1

        # --------------------------
        # IMAGES
        # --------------------------

        elif extension in IMAGE_EXTENSIONS:
            destination_folder = IMAGE_FOLDER
            image_count += 1

        # --------------------------
        # VIDEOS
        # --------------------------

        elif extension in VIDEO_EXTENSIONS:
            destination_folder = VIDEO_FOLDER
            video_count += 1

        # --------------------------
        # OTHER FILES
        # --------------------------

        else:
            skipped_count += 1
            continue

        destination_path = get_unique_destination(
            destination_folder,
            filename
        )

        try:
            shutil.move(source_path, destination_path)

            print(
                f"Moved: {source_path}\n"
                f"    -> {destination_path}\n"
            )

        except Exception as e:
            print(f"ERROR moving {source_path}: {e}")


# ==========================================
# SUMMARY
# ==========================================

print("\n================================")
print("          COMPLETE")
print("================================")
print(f"Text/JSON files : {text_count}")
print(f"Image files     : {image_count}")
print(f"Video files     : {video_count}")
print(f"Skipped files   : {skipped_count}")
print("================================")
