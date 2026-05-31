export const LinkedAccounts = () => {
  return (
    <div>
      <h1>Linked Accounts</h1>
      <p>Manage your connected coding platform accounts here.</p>

      <section>
        <h2>Available Platforms</h2>
        <ul>
          <li>
            <h3>Codeforces</h3>
            <p>Status: Not Connected</p>
            <button>Connect</button>
          </li>
          <li>
            <h3>LeetCode</h3>
            <p>Status: Not Connected</p>
            <button>Connect</button>
          </li>
        </ul>
      </section>

      <section>
        <h2>Connected Accounts</h2>
        <p>No accounts connected yet.</p>
      </section>
    </div>
  );
};

export default LinkedAccounts;
