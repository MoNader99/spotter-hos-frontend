import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Paper,
  Divider,
  Box,
} from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import { formatDistance } from "../utils/formatters";

const FuelStopsList = ({ fuelStops, onFuelStopClick }) => {
  if (!fuelStops || fuelStops.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Fuel Stops
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No fuel stops planned for this trip.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Fuel Stops
      </Typography>
      <Box sx={{ maxHeight: 200, overflow: "auto" }}>
        <List>
          {fuelStops.map((stop, index) => (
            <React.Fragment key={index}>
              <ListItem
                button
                onClick={() => onFuelStopClick(stop)}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <ListItemIcon>
                  <LocalGasStationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`Stop ${index + 1}`}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        Distance: {formatDistance(stop.distance_from_start)}{" "}
                        miles
                      </Typography>
                      <br />
                      <Typography
                        variant="body2"
                        component="span"
                        color="text.secondary"
                      >
                        {stop.gas_stations.length} gas stations nearby
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < fuelStops.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default FuelStopsList;
