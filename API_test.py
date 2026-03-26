import requests

url = "https://aicafe.hcl.com/AICafeService/api/v1/subscription/openai/deployments/gpt-4.1/chat/completions?api-version=2024-12-01-preview"

headers = {
    "api-key": "6b63011f-b0c0-48e5-8347-9a9a24225a89",
    "Content-Type": "application/json"
}

data = {
    "model": "gpt-4o-mini",
    "messages": [
        {"role": "user", "content": "Hello, is my API working?"}
    ]
}

response = requests.post(url, headers=headers, json=data)

print("Status Code:", response.status_code)
print("Response:", response.text)