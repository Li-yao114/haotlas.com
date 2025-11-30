import React from "react";

export default function Home() {
  return (
    <>
      {/* 首屏：头像居中，标题先只写名字，其他简介先留空 */}
      <section id="about" className="hero">
        <div className="hero-avatar" />
        <h1 className="hero-title">Haotlas</h1>

        {/* 下面这几行先注释掉，等你想好文案再写 */}
        {/*
        <p className="hero-subtitle">这里以后写一句话简介</p>
        <p className="hero-description">
          这里可以写稍微长一点的自我介绍，比如工作、兴趣方向等。
        </p>
        <div className="hero-tags">
          <span className="pill">Tag1</span>
          <span className="pill">Tag2</span>
        </div>
        */}
      </section>
      
    </>
  );
}
