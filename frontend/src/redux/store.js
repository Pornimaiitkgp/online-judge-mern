import { configureStore } from '@reduxjs/toolkit'
import userReducer from './user/userSlice';
import { useDispatch } from 'react-redux';


export const store = configureStore({
  reducer: {user: userReducer},
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

