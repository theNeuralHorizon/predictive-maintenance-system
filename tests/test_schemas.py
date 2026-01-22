import pytest
from backend.schemas.request import MachineData

def test_machine_data_schema():
    """Smoke test to verify Pydantic schema validation."""
    valid_data = {
        "Air temperature [K]": 300.0,
        "Process temperature [K]": 310.0,
        "Rotational speed [rpm]": 1500,
        "Torque [Nm]": 40.0,
        "Tool wear [min]": 100
    }
    obj = MachineData(**valid_data)
    assert obj.air_temperature == 300.0
    assert obj.process_temperature == 310.0

def test_machine_data_schema_invalid():
    """Test validation failure."""
    invalid_data = {
        "Air temperature [K]": "hot", # Invalid type
        "Process temperature [K]": 310.0,
        "Rotational speed [rpm]": 1500,
        "Torque [Nm]": 40.0,
        "Tool wear [min]": 100
    }
    with pytest.raises(ValueError):
        MachineData(**invalid_data)
