from typing import List
from pydantic import BaseModel, Field

class MachineData(BaseModel):
    udi: int | None = Field(None, alias="UDI", description="Unique Identifier")
    air_temperature: float | None = Field(None, alias="Air temperature [K]", description="Air temperature in Kelvin")
    process_temperature: float | None = Field(None, alias="Process temperature [K]", description="Process temperature in Kelvin")
    rotational_speed: float | None = Field(None, alias="Rotational speed [rpm]", description="Rotational speed in RPM")
    torque: float | None = Field(None, alias="Torque [Nm]", description="Torque in Nm")
    tool_wear: float | None = Field(None, alias="Tool wear [min]", description="Tool wear in minutes")

    engine_rpm: float | None = Field(None, description="Engine RPM for Car model")
    oil_pressure_psi: float | None = Field(None, description="Oil pressure for Car model")
    coolant_temp_c: float | None = Field(None, description="Coolant temperature for Car model")
    vibration_level: float | None = Field(None, description="Vibration level for Car model")
    engine_temp_c: float | None = Field(None, description="Engine temperature for Car model")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "Air temperature [K]": 298.1,
                "Process temperature [K]": 308.6,
                "Rotational speed [rpm]": 1551,
                "Torque [Nm]": 42.8,
                "Tool wear [min]": 0
            }
        }

class SequencePredictionRequest(BaseModel):
    sequence: List[MachineData] = Field(..., description="List of sequential machine data points for RNN inference")

