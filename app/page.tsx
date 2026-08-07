"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  decodeXuanwu,
  isXuanwu,
  visibleXuanwuLength,
  xuanwufy,
  type XuanwuTone,
} from "./cipher";

type Notice = { text: string; kind: "ok" | "error" } | null;

export default function Home() {
  const [plainText, setPlainText] = useState("");
  const [xuanwuText, setXuanwuText] = useState("");
  const [tone, setTone] = useState<XuanwuTone>("standard");
  const [notice, setNotice] = useState<Notice>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((text: string, kind: "ok" | "error" = "ok") => {
    setNotice({ text, kind });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setNotice(null), 2600);
  }, []);

  const stats = useMemo(
    () => ({ plain: Array.from(plainText).length, xuanwu: visibleXuanwuLength(xuanwuText) }),
    [plainText, xuanwuText],
  );
  const recognized = useMemo(() => isXuanwu(xuanwuText), [xuanwuText]);

  const handleEncode = () => {
    if (!plainText) {
      showNotice("这个……是不是得先输入点东西。", "error");
      return;
    }
    try {
      setXuanwuText(xuanwufy(plainText, { tone }));
      showNotice("这个……已经遥遥领先了。");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "转换失败了。", "error");
    }
  };

  const handleDecode = () => {
    if (!xuanwuText.trim()) {
      showNotice("这个……是不是得先粘贴点玄武语。", "error");
      return;
    }
    try {
      setPlainText(decodeXuanwu(xuanwuText));
      showNotice("啊这个……原文找回来了。");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "无法识别这段玄武语。", "error");
    }
  };

  const handleCopy = async () => {
    if (!xuanwuText) {
      showNotice("这个……还没有可以复制的玄武语。", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(xuanwuText);
      showNotice("啊这个……复制好了。");
    } catch {
      showNotice("复制失败，请长按或手动复制。", "error");
    }
  };

  const handleClear = () => {
    setPlainText("");
    setXuanwuText("");
    showNotice("这个……清爽了。");
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="玄武加密首页">
          <span className="brand-mark" aria-hidden="true">玄</span>
          <span>玄武加密</span>
        </a>
        <div className="header-meta">
          <span className="local-badge"><i /> 本地处理</span>
          <button className="clear-button" type="button" onClick={handleClear}>
            <span aria-hidden="true">↺</span> 清空
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> XUANWU CIPHER</div>
        <h1>把一句正常的话，<br />变成「遥遥领先」的表达方式。</h1>
        <p>一千万以内最好的文本加密方式</p>
        <div className="vocabulary" aria-label="玄武语词汇">
          <span>啊</span><b>/</b><span>这个</span><b>/</b><span>我们</span><b>/</b><span>是吧</span><b>/</b><span className="leader">遥遥领先</span>
        </div>
      </section>

      <section className="converter" aria-label="玄武加密转换器">
        <div className="panel plain-panel">
          <div className="panel-heading">
            <div><span className="step">01</span><h2>原文</h2></div>
            <span className="count">{stats.plain.toLocaleString()} 字</span>
          </div>
          <textarea
            value={plainText}
            onChange={(event) => setPlainText(event.target.value)}
            placeholder="请输入这个……这个……您的这个……文本"
            aria-label="原文"
            spellCheck={false}
          />
          <div className="panel-footer plain-footer">
            <div className="tone-control" role="group" aria-label="口音浓度">
              <span>口音浓度</span>
              <div className="tone-options">
                {([
                  ["brief", "精简"],
                  ["standard", "标准"],
                  ["verbose", "唠叨"],
                ] as const).map(([value, label]) => (
                  <button
                    className={`tone-option ${tone === value ? "active" : ""}`}
                    type="button"
                    aria-pressed={tone === value}
                    onClick={() => setTone(value)}
                    key={value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="plain-actions">
              <button className="clear-text-action" type="button" onClick={handleClear}>
                <span aria-hidden="true">↺</span> 清空文本
              </button>
              <button className="primary-action" type="button" onClick={handleEncode}>
                开始玄武化 <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flow-arrow" aria-hidden="true"><span>→</span></div>

        <div className="panel cipher-panel">
          <div className="panel-heading">
            <div><span className="step">02</span><h2>玄武语</h2></div>
            <div className="cipher-heading-meta">
              {xuanwuText && (
                <span className={`decode-status ${recognized ? "valid" : "invalid"}`}>
                  {recognized ? "可解码" : "未识别"}
                </span>
              )}
              <span className="count">{stats.xuanwu.toLocaleString()} 字</span>
            </div>
          </div>
          <textarea
            value={xuanwuText}
            onChange={(event) => setXuanwuText(event.target.value)}
            placeholder="啊这个，我们是吧……遥遥领先。啊，这个我们这个，是吧啊。"
            aria-label="玄武语"
            spellCheck={false}
          />
          <div className="panel-footer output-footer">
            <button className="secondary-action" type="button" onClick={handleDecode}>
              <span aria-hidden="true">↩</span> 玄武解码
            </button>
            <button className="copy-action" type="button" onClick={handleCopy}>
              <span aria-hidden="true">⧉</span> 复制玄武语
            </button>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="隐私特点">
        <div><span className="trust-icon">◇</span><p><strong>纯本地转换</strong><small>内容不会上传至服务器</small></p></div>
        <div><span className="trust-icon">◎</span><p><strong>完全可逆</strong><small>精确保留原文的每一个字符</small></p></div>
        <div><span className="trust-icon">✓</span><p><strong>无需登录</strong><small>打开即用，不保存转换记录</small></p></div>
      </section>

      <section className="how-it-works">
        <p className="section-kicker">这个……怎么玩</p>
        <h2>三步，开始遥遥领先</h2>
        <div className="steps-grid">
          <article><span>1</span><h3>输入原文</h3><p>粘贴任意文本，中英文和 Emoji 都没问题。</p></article>
          <article><span>2</span><h3>一键玄武化</h3><p>生成一句简短、随机又有口语感的玄武语。</p></article>
          <article><span>3</span><h3>复制或解码</h3><p>分享玄武语，再粘贴回来完整恢复原文。</p></article>
        </div>
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-mark small">玄</span><strong>玄武加密</strong><em>JUST FOR FUN</em></div>
        <p>本项目为网络文化娱乐创作，与华为技术有限公司及其关联公司无关，也不代表任何品牌官方立场。</p>
        <span className="footer-note">啊这个……好玩就行。</span>
      </footer>

      <div className={`toast ${notice ? "show" : ""} ${notice?.kind === "error" ? "error" : ""}`} role="status" aria-live="polite">
        <span>{notice?.kind === "error" ? "!" : "✓"}</span>{notice?.text}
      </div>
    </main>
  );
}
