import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc, precision_recall_fscore_support
from ml.data_loader import load_data
from ml.feature_engineering import add_rolling_features
from ml.preprocessing import preprocess_data
from ml.models import load_failure_model

# Ensure output directory exists
REPORT_DIR = "reports"
os.makedirs(REPORT_DIR, exist_ok=True)

def evaluate_model():
    print("Loading data for evaluation...")
    df = load_data()
    df_feat = add_rolling_features(df)
    
    # Re-create the split using same random state as training
    _, test_df = train_test_split(df_feat, test_size=0.2, random_state=42, stratify=df_feat['Machine failure'])
    
    print("Preprocessing Test Data...")
    # is_training=False ensures we use the scaler saved during training
    X_test, y_test, _ = preprocess_data(test_df, is_training=False)
    
    print("Loading Model...")
    model = load_failure_model()
    
    # Predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # 1. Confusion Matrix Plot
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.savefig(os.path.join(REPORT_DIR, 'confusion_matrix.png'))
    plt.close()
    
    # 2. ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    roc_auc = auc(fpr, tpr)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic (ROC)')
    plt.legend(loc="lower right")
    plt.savefig(os.path.join(REPORT_DIR, 'roc_curve.png'))
    plt.close()
    
    # 3. Generate Markdown Report
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')
    
    report_md = f"""# Model Evaluation Report

## Summary Metrics
| Metric | Value |
| :--- | :--- |
| **Accuracy** | {(y_test == y_pred).mean():.4f} |
| **Precision** | {precision:.4f} |
| **Recall** | {recall:.4f} |
| **F1-Score** | {f1:.4f} |
| **ROC-AUC** | {roc_auc:.4f} |

## Business Justification: Why Recall Matters?
In predictive maintenance, **Recall** is the most critical metric. 
- **High Recall** means we catch most actual failures (True Positives). 
- A **False Negative** (missing a failure) creates unplanned downtime, costing roughly $260k/hour in automotive manufacturing.
- A **False Positive** (flagging a healthy machine) only costs a scheduled inspection (low cost).
- Therefore, we prioritize a model that minimizes missed failures, even at the expense of slight over-alerting.

## Visualizations

### Confusion Matrix
![Confusion Matrix](./confusion_matrix.png)

### ROC Curve
![ROC Curve](./roc_curve.png)
"""
    
    with open(os.path.join(REPORT_DIR, "evaluation.md"), "w") as f:
        f.write(report_md)
        
    print(f"Evaluation complete. Reports generated in {REPORT_DIR}")

if __name__ == "__main__":
    evaluate_model()
