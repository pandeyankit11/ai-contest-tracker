import Header from '../components/Header';

export const LinkedAccounts = () => {
  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-heading">
          <h1>Linked Accounts</h1>
          <p>Manage your connected coding platform accounts here.</p>
        </section>

        <section className="content-grid">
          <article className="summary-card">
            <h2>Codeforces</h2>
            <p>Status: Not Connected</p>
            <button type="button">Connect</button>
          </article>

          <article className="summary-card">
            <h2>LeetCode</h2>
            <p>Status: Not Connected</p>
            <button type="button">Connect</button>
          </article>
        </section>

        <section className="panel-section">
          <h2>Connected Accounts</h2>
          <p>No accounts connected yet.</p>
        </section>
      </main>
    </>
  );
};

export default LinkedAccounts;
