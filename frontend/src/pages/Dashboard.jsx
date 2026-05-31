import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-heading">
          <h1>Dashboard</h1>
          <p>Welcome back{user?.email ? `, ${user.email}` : ''}.</p>
        </section>

        <section className="content-grid">
          <article className="summary-card">
            <h2>Linked Accounts</h2>
            <p>Connect coding platforms before contest insights appear here.</p>
            <Link to="/accounts">Manage accounts</Link>
          </article>

          <article className="summary-card">
            <h2>Upcoming Contests</h2>
            <p>Review upcoming contests across your connected platforms.</p>
            <Link to="/contests">View contests</Link>
          </article>
        </section>
      </main>
    </>
  );
};

export default Dashboard;
