from chromadb import HttpClient
import logging

logging.basicConfig(level=logging.DEBUG)

# Create client with server configuration
client = HttpClient(
    host="localhost",
    port=8000
)

try:
    # Test connection
    client.heartbeat()
    print("ChromaDB is running!")

    # Test collection operations
    try:
        client.delete_collection("test_collection")
    except:
        pass

    collection = client.create_collection("test_collection")
    print("Collection created successfully!")

except Exception as e:
    print(f"ChromaDB error: {e}")