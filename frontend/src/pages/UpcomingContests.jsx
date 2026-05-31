export const UpcomingContests = () => {
  return (
    <div>
      <h1>Upcoming Contests</h1>
      <p>Track and manage your upcoming contests across all platforms.</p>

      <section>
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
              <td colSpan="5">Loading contests...</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Filter Options</h2>
        <div>
          <label>
            <input type="checkbox" /> Show Codeforces
          </label>
          <label>
            <input type="checkbox" /> Show LeetCode
          </label>
        </div>
      </section>
    </div>
  );
};

export default UpcomingContests;
