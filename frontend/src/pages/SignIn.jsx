import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice';
import axios from 'axios';


import OAuth from '../components/OAuth'; // 

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const { loading, error } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());
      const res = await axios.post('/api/auth/signin', formData);
      const data = res.data;
            console.log('SignIn handleSubmit: Full Backend Response Data:', data); 



      if (data.success === false) { 
        dispatch(signInFailure(data.message));
        return;
      }

      console.log('SignIn handleSubmit: Value of data.token before storing:', data.token);

      // Store the JWT token in localStorage
      if (data.token) { 
        localStorage.setItem('token', data.token);
        console.log('SignIn handleSubmit: JWT Token successfully stored in localStorage.'); 
      } else {
console.warn('SignIn handleSubmit: No token received from backend sign-in response. Check your backend auth.controller.js');      }

      dispatch(signInSuccess(data.user)); 
      navigate('/');
    } catch (error) {
      console.error('Sign-in error:', error);
      dispatch(signInFailure(error.response?.data?.message || error.message || 'An unknown error occurred during sign-in.'));
    }
  };

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl text-center font-semibold my-7'>Sign In</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='email'
          placeholder='email'
          className='border p-3 rounded-lg'
          id='email'
          onChange={handleChange}
          required
        />
        <input
          type='password'
          placeholder='password'
          className='border p-3 rounded-lg'
          id='password'
          onChange={handleChange}
          required
        />

        <button
          disabled={loading}
          className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Loading...' : 'Sign In'}
        </button>
        
            <OAuth />
       
      </form>
      <div className='flex gap-2 mt-5'>
        <p>Dont have an account?</p>
        <Link to={'/signup'}>
          <span className='text-blue-700'>Sign up</span>
        </Link>
      </div>
      {error && <p className='text-red-500 mt-5'>{error}</p>}
    </div>
  );
}