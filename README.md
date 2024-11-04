## <a href="https://yt-bytes.vercel.app">yt-bytes</a>


 Convert an Audio File (e.g., MP3 to M4A)
```
curl -X POST http://your-api-url/convert \
  -F "file=@/path/to/your/input-file.mp3" \
  -F "format=m4a" \
  -o output-file.m4a
```
 Convert an Audio File (e.g., WAV to MP3)
```
curl -X POST http://your-api-url/convert \
  -F "file=@/path/to/your/input-file.wav" \
  -F "format=mp3" \
  -o output-file.mp3
```
 Convert an Audio File (e.g., OGG to M4R)
```
curl -X POST http://your-api-url/convert \
  -F "file=@/path/to/your/input-file.ogg" \
  -F "format=m4r" \
  -o output-file.m4r

``````
