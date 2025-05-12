import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../config/env";

// Create axios instance with auth header
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Function to get the token from Redux state
const getAuthToken = (state) => state.auth.token;

export const fetchAvailableTrips = createAsyncThunk(
  "trips/fetchAvailableTrips",
  async (_, { getState }) => {
    const token = getState().auth.token;
    const response = await axiosInstance.get("/trips/available/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
);

export const fetchMyTrips = createAsyncThunk(
  "trips/fetchMyTrips",
  async (_, { getState }) => {
    const token = getState().auth.token;
    const response = await axiosInstance.get("/trips/my-trips/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
);

export const fetchTripDetails = createAsyncThunk(
  "trips/fetchTripDetails",
  async (tripId, { getState }) => {
    const token = getState().auth.token;
    const response = await axiosInstance.get(`/trips/${tripId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
);

export const fetchTripRoute = createAsyncThunk(
  "trips/fetchTripRoute",
  async (tripId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.get(`/trips/${tripId}/route/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const assignTrip = createAsyncThunk(
  "trips/assignTrip",
  async (tripId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.post(
        `/trips/${tripId}/assign/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      // If we have a response from the server, use its error message
      if (error.response?.data) {
        return rejectWithValue({
          status: error.response.status,
          detail:
            error.response.data.detail ||
            error.response.data.message ||
            "Failed to assign trip",
        });
      }

      // If no response from server (network error, etc)
      return rejectWithValue({
        status: 500,
        detail: "Network error or server is not responding",
      });
    }
  }
);

export const addTripLog = createAsyncThunk(
  "trips/addTripLog",
  async ({ tripId, logData }, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.post(
        `/trips/${tripId}/add-log/`,
        logData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const completeTrip = createAsyncThunk(
  "trips/completeTrip",
  async (tripId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.post(
        `/trips/${tripId}/complete/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createTrip = createAsyncThunk(
  "trips/createTrip",
  async (tripData, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.post("/trips/", tripData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const generateTripLogs = createAsyncThunk(
  "trips/generateTripLogs",
  async (tripId, { getState, rejectWithValue }) => {
    try {
      const token = getAuthToken(getState());
      const response = await axiosInstance.post(
        `/trips/${tripId}/generate-logs/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return {
        ...response.data,
        trip_id: tripId,
      };
    } catch (error) {
      if (error.response?.data) {
        return rejectWithValue({
          status: error.response.status,
          detail: error.response.data.detail || "Failed to generate logs",
        });
      }
      return rejectWithValue({
        status: 500,
        detail: "Network error or server is not responding",
      });
    }
  }
);

const initialState = {
  availableTrips: [],
  myTrips: [],
  currentTrip: null,
  tripRoute: null,
  loading: false,
  error: null,
};

const tripsSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTrip: (state) => {
      state.currentTrip = null;
      state.tripRoute = null;
    },
    updateTripInMyTrips: (state, action) => {
      const updatedTrip = action.payload;
      const index = state.myTrips.findIndex(
        (trip) => trip.id === updatedTrip.id
      );
      if (index !== -1) {
        state.myTrips[index] = updatedTrip;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Available Trips
      .addCase(fetchAvailableTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.availableTrips = action.payload;
      })
      .addCase(fetchAvailableTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch My Trips
      .addCase(fetchMyTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.myTrips = action.payload;
      })
      .addCase(fetchMyTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Trip Details
      .addCase(fetchTripDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(fetchTripDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Trip Route
      .addCase(fetchTripRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.tripRoute = action.payload;
      })
      .addCase(fetchTripRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Assign Trip
      .addCase(assignTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignTrip.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTrip) {
          state.currentTrip = {
            ...state.currentTrip,
            status: "IN_PROGRESS",
            driver: action.payload.driver,
          };
        }
      })
      .addCase(assignTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Trip Log
      .addCase(addTripLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTripLog.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTrip) {
          state.currentTrip.logs = [...state.currentTrip.logs, action.payload];
        }
      })
      .addCase(addTripLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Complete Trip
      .addCase(completeTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(completeTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Trip
      .addCase(createTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.availableTrips = [...state.availableTrips, action.payload];
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Generate Trip Logs
      .addCase(generateTripLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateTripLogs.fulfilled, (state, action) => {
        state.loading = false;
        const tripIndex = state.myTrips.findIndex(
          (trip) => trip.id === action.payload.trip_id
        );
        if (tripIndex !== -1) {
          state.myTrips[tripIndex] = {
            ...state.myTrips[tripIndex],
            status: "IN_PROGRESS",
            logs: action.payload.logs || [],
            daily_logs: action.payload.daily_logs || [],
            auto_generated: true,
          };
        }
        if (state.currentTrip?.id === action.payload.trip_id) {
          state.currentTrip = {
            ...state.currentTrip,
            status: "IN_PROGRESS",
            logs: action.payload.logs || [],
            daily_logs: action.payload.daily_logs || [],
            auto_generated: true,
          };
        }
      })
      .addCase(generateTripLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentTrip, updateTripInMyTrips } =
  tripsSlice.actions;
export default tripsSlice.reducer;
