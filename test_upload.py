import requests

url = "http://localhost:9823/api/courses"
data = {
    "name": "Course With Image",
    "path": "C:\\TestImage"
}
with open("test.txt", "w") as f:
    f.write("dummy image content")

files = {
    "imageFile": ("test.jpg", open("test.txt", "rb"), "image/jpeg")
}

response = requests.post(url, data=data, files=files)
print(response.status_code)
print(response.text)
