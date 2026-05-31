import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your AI Contest Tracker Dashboard!</p>
      {user && <p>Logged in as: {user.email}</p>}
      
      <div>
        <h2>Quick Links</h2>
        <ul>
          <li><a href="/linked-accounts">Linked Accounts</a></li>
          <li><a href="/upcoming-contests">Upcoming Contests</a></li>
        </ul>
      </div>

      <section>
        <h2>Dashboard Content</h2>
        <p>Your contest tracking statistics and insights will appear here.</p>
      </section>
    </div>
  );
};

export default Dashboard;
