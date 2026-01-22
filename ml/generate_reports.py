import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from backend.services.ml_service import ml_service

# Ensure output directory exists
REPORT_DIR = "reports"
os.makedirs(REPORT_DIR, exist_ok=True)

def generate_feature_importance_plot():
    print("Generating Feature Importance Plot...")
    
    # Use the service to get importance data
    # (Assuming ml_service loads models on init, which happens at module level import in app context, 
    # but here we might need to manually ensure load if it relies on app startup)
    
    # Manually ensure load for script execution
    if not ml_service.failure_model:
        # Load logic is in __init__, so just instantiating or using the singleton
        # The singleton is already instantiated in backend.services.ml_service
        pass

    try:
        importance_data = ml_service.get_feature_importance()
        
        df = pd.DataFrame(importance_data)
        
        plt.figure(figsize=(10, 6))
        sns.barplot(x="importance", y="feature", data=df, palette="viridis")
        plt.title("Random Forest Feature Importance")
        plt.xlabel("Importance Score")
        plt.ylabel("Feature")
        plt.tight_layout()
        
        output_path = os.path.join(REPORT_DIR, "feature_importance.png")
        plt.savefig(output_path)
        print(f"Saved plot to {output_path}")
        
    except Exception as e:
        print(f"Error generating plot: {e}")

if __name__ == "__main__":
    generate_feature_importance_plot()
