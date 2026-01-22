import os
import requests
import pandas as pd

DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00601/ai4i2020.csv"
RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/raw/ai4i2020.csv")

def download_data(url: str = DATA_URL, save_path: str = RAW_DATA_PATH) -> None:
    """Downloads the AI4I 2020 dataset if it doesn't exist."""
    if os.path.exists(save_path):
        print(f"Data already exists at {save_path}")
        return

    print(f"Downloading data from {url}...")
    response = requests.get(url)
    response.raise_for_status()

    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(response.content)
    print("Download complete.")

def load_data(path: str = RAW_DATA_PATH) -> pd.DataFrame:
    """Loads the dataset into a pandas DataFrame."""
    if not os.path.exists(path):
        download_data(save_path=path)
    
    return pd.read_csv(path)

if __name__ == "__main__":
    # Test the loader
    df = load_data()
    print(df.head())
