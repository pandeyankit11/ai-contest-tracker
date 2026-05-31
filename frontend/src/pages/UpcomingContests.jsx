import Header from '../components/Header';

export const UpcomingContests = () => {
  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-heading">
          <h1>Upcoming Contests</h1>
          <p>Track upcoming contests across all connected platforms.</p>
        </section>

        <section className="panel-section">
          <h2>Contest List</h2>
          <p>No contests found. Connect your accounts to see upcoming contests.</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Platform</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5">No contest data loaded yet.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="panel-section">
          <h2>Filter Options</h2>
          <div className="filter-row">
            <label>
              <input type="checkbox" /> Show Codeforces
            </label>
            <label>
              <input type="checkbox" /> Show LeetCode
            </label>
          </div>
        </section>
      </main>
    </>
  );
};

export default UpcomingContests;
