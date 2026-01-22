import threading

class MetricsCollector:
    def __init__(self):
        self._lock = threading.Lock()
        self._predictions_total = 0
        self._anomalies_total = 0
        self._failures_total = 0

    def increment_predictions(self):
        with self._lock:
            self._predictions_total += 1

    def increment_anomalies(self):
        with self._lock:
            self._anomalies_total += 1

    def increment_failures(self):
        with self._lock:
            self._failures_total += 1

    def generate_latest(self) -> str:
        """Returns metrics in Prometheus text format."""
        lines = []
        
        with self._lock:
            p_count = self._predictions_total
            a_count = self._anomalies_total
            f_count = self._failures_total
            
        lines.append("# HELP predictions_total Total number of predictions served")
        lines.append("# TYPE predictions_total counter")
        lines.append(f"predictions_total {p_count}")
        
        lines.append("# HELP anomalies_total Total number of anomalies detected")
        lines.append("# TYPE anomalies_total counter")
        lines.append(f"anomalies_total {a_count}")
        
        lines.append("# HELP failures_total Total number of machine failures predicted")
        lines.append("# TYPE failures_total counter")
        lines.append(f"failures_total {f_count}")
        
        return "\n".join(lines) + "\n"

# Global instance
metrics_collector = MetricsCollector()
