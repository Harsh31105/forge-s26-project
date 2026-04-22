import uvicorn
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/../../..")

if __name__ == "__main__":
    uvicorn.run("backend.recommendations.api.app:app", host="localhost", port=8000, reload=True)
