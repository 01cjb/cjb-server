// 첫 화면 로딩 인트로: 로고 마크가 튀어나오고 글자가 왼쪽부터 써지듯 나타난 뒤 사라짐 (세션당 한 번, CSS만 사용)
export default function Intro() {
  return (
    <div className="bw-intro" aria-hidden>
      <div className="bw-intro__logo">
        <span className="bw-intro__mark" />
        <span className="bw-intro__word" />
      </div>
      <span className="bw-intro__bar" />
    </div>
  );
}
