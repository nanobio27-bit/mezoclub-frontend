export default function Particles() {
  const particles = Array.from({ length: 60 }, (_, i) => {
    const size = 1 + Math.random() * 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 20;
    const duration = 15 + Math.random() * 25;
    return (
      <div
        key={i}
        className="particle"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return <div className="particles-container">{particles}</div>;
}
