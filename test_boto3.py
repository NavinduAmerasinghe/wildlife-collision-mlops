import boto3

s3 = boto3.client(
    "s3",
    endpoint_url="http://localhost:8333",
    aws_access_key_id="wildlife",
    aws_secret_access_key="wildlife-secret",
)

response = s3.list_buckets()

print("Buckets:")
for bucket in response.get("Buckets", []):
    print(bucket["Name"])