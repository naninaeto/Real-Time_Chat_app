

// import './App.css';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useState } from 'react';
// import { faker } from '@faker-js/faker'; // ✅ Faker import
// import Login from './auth/Login';
// import Signup from './auth/Signup';
// import Contacts from './pages/Contacts';
// import OneToOneChat from './pages/onetoonechat';
// import GroupChat from './pages/GroupChat';
// import UserProfile from './pages/UserProfile';
// import Home from './pages/Home';
// import MainLayout from './component/MainLayout';
// import NewGroup from './pages/NewGroup';
// import GroupChatList from './pages/GroupChatList';

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);

//   const handleLogin = (userData: { id: string; name?: string; email: string }) => {
//     setIsAuthenticated(true);
//     setUser({
//       name: userData.name || faker.internet.userName(),
//       email: userData.email,
//       avatar: faker.image.avatar(),
//     });
//   };

//   const handleLogout = () => {
//     setIsAuthenticated(false);
//     setUser(null);
//   };

//   return (
//     <Router>
//       <Routes>
//         <Route 
//           path="/login" 
//           element={
//             isAuthenticated ? 
//               <Navigate to="/" /> : 
//               <Login onLogin={handleLogin} /> 
//           } 
//         />
//         <Route path="/signup" element={<Signup />} />
        
//         <Route 
//           path="/" 
//           element={
//             isAuthenticated ? 
//               <MainLayout user={user} onLogout={handleLogout} /> : 
//               <Navigate to="/login" />
//           }
//         >
//           <Route index element={<Home />} />
//           <Route path="contacts" element={<Contacts />} />
//           <Route path="onetoonechat" element={<OneToOneChat />} />
//           <Route path="groupchat" element={<GroupChat />} />
//           <Route path="newgroup" element={<NewGroup />} />
//           <Route path="groupchatlist" element={<GroupChatList/>} />
//           <Route path="/groupchat/:groupId" element={<GroupChat />} />
//           {user && <Route path="profile" element={<UserProfile user={user} />} />}
//           <Route path="onetoonechat/:contactEmail" element={<OneToOneChat />} />
//         </Route>
        
//         <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;


import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import Login from './auth/Login';
import Signup from './auth/Signup';
import Contacts from './pages/Contacts';
import OneToOneChat from './pages/onetoonechat';
import GroupChat from './pages/GroupChat';
import UserProfile from './pages/UserProfile';
import Home from './pages/Home';
import MainLayout from './component/MainLayout';
import NewGroup from './pages/NewGroup';
import GroupChatList from './pages/GroupChatList';
import SplashScreen from './component/SplashScreen'; // Import the splash screen

// User type definition
type User = {
  name: string;
  email: string;
  avatar: string;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simulate loading process
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3 seconds splash screen

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userData: { id: string; name?: string; email: string }) => {
    setIsAuthenticated(true);
    setUser({
      name: userData.name || faker.internet.userName(),
      email: userData.email,
      avatar: faker.image.avatar(),
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to="/" /> : 
              <Login onLogin={handleLogin} /> 
          } 
        />
        <Route path="/signup" element={<Signup />} />
        
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              <MainLayout user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
          }
        >
          <Route index element={<Home />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="onetoonechat" element={<OneToOneChat />} />
          <Route path="groupchat" element={<GroupChat />} />
          <Route path="newgroup" element={<NewGroup />} />
          <Route path="groupchatlist" element={<GroupChatList/>} />
          <Route path="/groupchat/:groupId" element={<GroupChat />} />
          {user && <>
            <Route path="profile" element={<UserProfile user={user} />} />
            <Route path="onetoonechat/:contactEmail" element={<OneToOneChat />} />
          </>}
        </Route>
        
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;