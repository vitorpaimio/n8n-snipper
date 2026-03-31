import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <Link
        href="/workflow"
        style={{
          border: "1px solid #3a3a3d",
          borderRadius: 10,
          padding: "12px 16px",
          background: "#1f1f22",
        }}
      >
        Abrir editor de workflow
      </Link>
    </main>
  );
}
