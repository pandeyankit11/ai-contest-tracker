import Header from '../components/Header';
import CodeforcesCard from '../components/Dashboard/CodeforcesCard';
import HeaderInfo from '../components/Dashboard/HeaderInfo';
import LinkedAccountsSummary from '../components/Dashboard/LinkedAccountsSummary';
import UpcomingContestsPreview from '../components/Dashboard/UpcomingContestsPreview';

export const Dashboard = () => {
  return (
    <>
      <Header />
      <main className="page-shell dashboard-shell">
        <HeaderInfo />

        <section className="dashboard-grid" aria-label="Dashboard summary">
          <CodeforcesCard />
          <LinkedAccountsSummary />
          <UpcomingContestsPreview />
        </section>
      </main>
    </>
  );
};

export default Dashboard;
