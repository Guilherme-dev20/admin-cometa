import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import { Plus, Trash2, Type, X } from 'lucide-react';

const SIZE = 500;

// ── Nó de imagem ──────────────────────────────────────────────
function StampNode({ item, isSelected, onSelect, onChange }) {
  const [img, setImg] = useState(null);
  const nodeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = item.url;
    image.onload = () => setImg(image);
  }, [item.url]);

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!img) return null;

  return (
    <>
      <KonvaImage
        ref={nodeRef}
        image={img}
        x={item.x} y={item.y}
        width={item.width} height={item.height}
        rotation={item.rotation || 0}
        draggable
        onClick={onSelect} onTap={onSelect}
        onDragEnd={(e) => onChange({ ...item, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const n = nodeRef.current;
          const sx = n.scaleX(); const sy = n.scaleY();
          n.scaleX(1); n.scaleY(1);
          onChange({ ...item, x: n.x(), y: n.y(), width: Math.max(20, n.width() * sx), height: Math.max(20, n.height() * sy), rotation: n.rotation() });
        }}
      />
      {isSelected && <Transformer ref={trRef} boundBoxFunc={(o, n) => (n.width < 20 || n.height < 20 ? o : n)} />}
    </>
  );
}

// ── Nó de texto ───────────────────────────────────────────────
function TextNode({ item, isSelected, onSelect, onChange, stageRef, scale }) {
  const nodeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  function startEdit() {
    const node = nodeRef.current;
    const stage = stageRef.current;
    if (!node || !stage) return;

    node.hide();
    trRef.current?.hide();
    stage.batchDraw();

    const stageBox = stage.container().getBoundingClientRect();
    const absPos = node.getAbsolutePosition();

    const area = document.createElement('textarea');
    area.value = item.text;
    area.style.cssText = `
      position:fixed;
      top:${stageBox.top + absPos.y * scale}px;
      left:${stageBox.left + absPos.x * scale}px;
      font-size:${item.fontSize * scale}px;
      font-family:${item.fontFamily || 'Arial'};
      color:${item.fill || '#ffffff'};
      background:rgba(0,0,0,0.6);
      border:1px solid #a855f7;
      border-radius:4px;
      padding:2px 4px;
      outline:none;
      resize:none;
      z-index:9999;
      min-width:60px;
      transform:rotate(${item.rotation || 0}deg);
      transform-origin:top left;
    `;
    document.body.appendChild(area);
    area.focus();
    area.select();

    function finish() {
      const val = area.value.trim() || item.text;
      onChange({ ...item, text: val });
      document.body.removeChild(area);
      node.show();
      trRef.current?.show();
      stage.batchDraw();
    }

    area.addEventListener('blur', finish);
    area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(); } });
  }

  return (
    <>
      <KonvaText
        ref={nodeRef}
        x={item.x} y={item.y}
        text={item.text}
        fontSize={item.fontSize || 40}
        fontFamily={item.fontFamily || 'Arial'}
        fontStyle={item.bold ? 'bold' : 'normal'}
        fill={item.fill || '#ffffff'}
        rotation={item.rotation || 0}
        draggable
        onClick={onSelect} onTap={onSelect}
        onDblClick={startEdit} onDblTap={startEdit}
        onDragEnd={(e) => onChange({ ...item, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const n = nodeRef.current;
          const sx = n.scaleX();
          n.scaleX(1); n.scaleY(1);
          onChange({ ...item, x: n.x(), y: n.y(), fontSize: Math.max(8, (item.fontSize || 40) * sx), rotation: n.rotation() });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(o, n) => ({ ...n, height: o.height })}
        />
      )}
    </>
  );
}

// ── Modal adicionar texto ──────────────────────────────────────
function AddTextModal({ onAdd, onClose }) {
  const [text, setText] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(48);
  const [bold, setBold] = useState(false);

  function confirm() {
    if (!text.trim()) return;
    onAdd({ text: text.trim(), fill: color, fontSize, bold });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-950 border border-white/10 p-5 shadow-2xl shadow-purple-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-white">Adicionar Texto</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/60 font-semibold mb-1 block">Texto</label>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirm()}
              placeholder="Digite o texto..."
              className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60 font-semibold mb-1 block">Cor</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 rounded-lg cursor-pointer border border-white/10 bg-transparent flex-shrink-0" />
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} maxLength={7}
                  className="flex-1 px-2 py-1.5 bg-white/5 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 font-semibold mb-1 block">Tamanho</label>
              <input type="number" value={fontSize} min={10} max={200}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white/5 text-white border border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <button
            onClick={() => setBold(!bold)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition ${
              bold ? 'bg-purple-500/15 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            <span className="font-black text-base">B</span> Negrito
          </button>

          {/* Preview */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-center min-h-12">
            <span style={{ color, fontSize: Math.min(fontSize, 32), fontWeight: bold ? 'bold' : 'normal', fontFamily: 'Arial' }}>
              {text || 'Pré-visualização'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm font-semibold transition">
            Cancelar
          </button>
          <button onClick={confirm} disabled={!text.trim()}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-extrabold shadow-lg shadow-purple-500/20 disabled:opacity-40 transition">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Editor principal ───────────────────────────────────────────
export default function ShirtEditor({ cor, stamps, onStampsChange, onExport }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const stageRef = useRef();
  const containerRef = useRef();
  const timerRef = useRef();
  const [stageWidth, setStageWidth] = useState(SIZE);

  useEffect(() => {
    function update() {
      if (containerRef.current) setStageWidth(Math.min(containerRef.current.offsetWidth, SIZE));
    }
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const scale = stageWidth / SIZE;

  const triggerExport = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!stageRef.current) return;
      // Esconde transformers para não aparecerem na textura
      const trs = stageRef.current.find('Transformer');
      trs.forEach((tr) => tr.hide());
      stageRef.current.batchDraw();

      const dataUrl = stageRef.current.toDataURL({ pixelRatio: SIZE / stageWidth * 2 });

      // Restaura transformers
      trs.forEach((tr) => tr.show());
      stageRef.current.batchDraw();

      onExport(dataUrl);
    }, 180);
  }, [onExport, stageWidth]);

  useEffect(() => { triggerExport(); }, [cor, stamps]);

  function handleStageClick(e) {
    if (e.target === e.target.getStage() || e.target.name() === 'bg') setSelectedId(null);
  }

  function addImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onStampsChange([...stamps, { id: Date.now().toString(), type: 'image', url, x: SIZE / 2 - 75, y: SIZE / 2 - 75, width: 150, height: 150, rotation: 0, file }]);
    e.target.value = '';
  }

  function addText({ text, fill, fontSize, bold }) {
    onStampsChange([...stamps, { id: Date.now().toString(), type: 'text', text, fill, fontSize, bold, x: SIZE / 2 - 80, y: SIZE / 2 - fontSize / 2, rotation: 0 }]);
  }

  function updateItem(updated) {
    onStampsChange(stamps.map((s) => (s.id === updated.id ? updated : s)));
  }

  function deleteSelected() {
    onStampsChange(stamps.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }

  const selected = stamps.find((s) => s.id === selectedId);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Editor</p>
        <div className="flex gap-2 flex-wrap">
          {selectedId && (
            <button onClick={deleteSelected}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-400/20 text-red-300 text-xs font-semibold hover:bg-red-500/20 transition">
              <Trash2 size={12} /> Remover
            </button>
          )}
          <button onClick={() => setShowTextModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-400/20 text-blue-300 text-xs font-semibold hover:bg-blue-500/25 transition">
            <Type size={12} /> Adicionar texto
          </button>
          <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-400/20 text-purple-300 text-xs font-semibold cursor-pointer hover:bg-purple-500/25 transition">
            <Plus size={12} /> Adicionar imagem
            <input type="file" accept="image/*" className="hidden" onChange={addImage} />
          </label>
        </div>
      </div>

      {/* Controles inline do item de texto selecionado */}
      {selected?.type === 'text' && (
        <div className="flex gap-2 items-center flex-wrap bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <span className="text-xs text-white/40 font-semibold">Texto:</span>
          <input
            value={selected.text}
            onChange={(e) => updateItem({ ...selected, text: e.target.value })}
            className="flex-1 min-w-24 px-2 py-1 bg-white/5 text-white border border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500"
          />
          <input type="color" value={selected.fill || '#ffffff'} onChange={(e) => updateItem({ ...selected, fill: e.target.value })}
            className="w-8 h-7 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0" />
          <input type="number" value={selected.fontSize || 40} min={8} max={200}
            onChange={(e) => updateItem({ ...selected, fontSize: Number(e.target.value) })}
            className="w-16 px-2 py-1 bg-white/5 text-white border border-white/10 rounded-lg text-xs text-center outline-none focus:ring-1 focus:ring-purple-500" />
          <button
            onClick={() => updateItem({ ...selected, bold: !selected.bold })}
            className={`px-2 py-1 rounded-lg border text-xs font-black transition ${selected.bold ? 'bg-purple-500/15 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
            B
          </button>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="rounded-xl overflow-hidden border border-white/10 w-full" style={{ height: stageWidth, lineHeight: 0 }}>
        <Stage
          ref={stageRef}
          width={stageWidth} height={stageWidth}
          scaleX={scale} scaleY={scale}
          onClick={handleStageClick} onTap={handleStageClick}
          style={{ display: 'block' }}
        >
          <Layer>
            <Rect name="bg" x={0} y={0} width={SIZE} height={SIZE} fill={cor || '#ffffff'} />
            {stamps.map((item) =>
              item.type === 'text' ? (
                <TextNode
                  key={item.id} item={item}
                  isSelected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                  onChange={updateItem}
                  stageRef={stageRef}
                  scale={scale}
                />
              ) : (
                <StampNode
                  key={item.id} item={item}
                  isSelected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                  onChange={updateItem}
                />
              )
            )}
          </Layer>
        </Stage>
      </div>

      <p className="text-xs text-white/20 text-center">
        Clique para selecionar · Arraste para mover · Handles para redimensionar · Duplo clique no texto para editar
      </p>

      {showTextModal && <AddTextModal onAdd={addText} onClose={() => setShowTextModal(false)} />}
    </div>
  );
}
