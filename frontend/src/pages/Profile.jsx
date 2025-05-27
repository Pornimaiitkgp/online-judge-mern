// import { useSelector } from "react-redux"
// import {useRef} from "react";

// export default function Profile() {
//   const fileRef= useRef(null);
//   const {currentUser} = useSelector((state) => state.user);
//   const [formData, setFormData] = useState({})
//   return (
//     <div className="p-3 max-w-lg mx-auto">
      
//       <h1 className='text-3xl font-semibold text-center my-7'>Profile</h1>
//       <form className="flex flex-col gap-4">
//         <input type="file"  ref={fileRef} hidden accept='image/*' /> 
//         <img onClick={()=>fileRef.current.click()} src={currentUser.avatar} alt="profile" className="rounded-full h-24 w-24 object-cover self-center mt-2"/>
//         <input type="text" placeholder='username' id='username' className='border p-3 rounded-lg' />
//         <input type="text" placeholder='email' id='email' className='border p-3 rounded-lg' />
//         <input type="text" placeholder='password' id='password' className='border p-3 rounded-lg' />
//         <button className="bg-slate-700 text-white rounded-lg p-3 hover:bg-slate-800 transition-all duration-300 uppercase
//         ">update</button>
//       </form>
//       <div className="flex justify-between mt-5">
//         <span className="text-red-700 cursor-pointer">Delete account</span>
//         <span className="text-red-700 cursor-pointer">Sign out</span>
        
//       </div>
//     </div>
//   )
// }

import { useSelector, useDispatch } from "react-redux";
import { useRef, useState, useEffect } from "react";
import { signInSuccess } from "../redux/user/userSlice";

export default function Profile() {
  const fileRef = useRef(null);
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    username: currentUser.username,
    email: currentUser.email,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUpdateSuccess(false);

    try {
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      dispatch(signInSuccess(data));
      setUpdateSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input type="file" ref={fileRef} hidden accept="image/*" />
        <img
          onClick={() => fileRef.current.click()}
          src={currentUser.avatar}
          alt="profile"
          className="rounded-full h-24 w-24 object-cover self-center mt-2 cursor-pointer"
        />
        <input
          type="text"
          placeholder="username"
          id="username"
          className="border p-3 rounded-lg"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="email"
          id="email"
          className="border p-3 rounded-lg"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="new password"
          id="password"
          className="border p-3 rounded-lg"
          value={formData.password}
          onChange={handleChange}
        />
        <button
          disabled={loading}
          className="bg-slate-700 text-white rounded-lg p-3 hover:bg-slate-800 transition-all duration-300 uppercase disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update"}
        </button>
      </form>

      {updateSuccess && (
        <p className="text-green-700 mt-4 text-center">Profile updated!</p>
      )}
      {error && <p className="text-red-700 mt-4 text-center">{error}</p>}

      <div className="flex justify-between mt-5">
        <span className="text-red-700 cursor-pointer">Delete account</span>
        <span className="text-red-700 cursor-pointer">Sign out</span>
      </div>
    </div>
  );
}

