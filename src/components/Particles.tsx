export default function Particles() {
  const stars = Array.from({ length: 50 }, (_, i) => {
    const size = 1 + Math.random() * 2;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = 3 + Math.random() * 4;
    const delay = Math.random() * 5;
    return (
      <div
        key={i}
        className="star"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          top: `${top}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return (
    <>
      <div className="particles-container">
        {stars}
      </div>
      <div className="nebula-blob nebula-blob-1" />
      <div className="nebula-blob nebula-blob-2" />
      <div className="nebula-blob nebula-blob-3" />
    </>
  );
}
