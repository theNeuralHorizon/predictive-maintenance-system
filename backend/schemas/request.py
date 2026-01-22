from pydantic import BaseModel, Field

class MachineData(BaseModel):
    air_temperature: float = Field(..., alias="Air temperature [K]", description="Air temperature in Kelvin")
    process_temperature: float = Field(..., alias="Process temperature [K]", description="Process temperature in Kelvin")
    rotational_speed: float = Field(..., alias="Rotational speed [rpm]", description="Rotational speed in RPM")
    torque: float = Field(..., alias="Torque [Nm]", description="Torque in Nm")
    tool_wear: float = Field(..., alias="Tool wear [min]", description="Tool wear in minutes")

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
