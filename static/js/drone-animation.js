// ドローン画像を動かすためのJavaScript
document.addEventListener('DOMContentLoaded', function() {
  // URLパラメータからドローン数と速度を取得（デフォルト値あり）
  const urlParams = new URLSearchParams(window.location.search);
  const droneCount = parseInt(urlParams.get('drones')) || 3; // デフォルト3機
  const speedFactor = parseFloat(urlParams.get('speed')) || 0.3; // デフォルト速度を30%に

  // 背景コンテナを作成
  const container = document.createElement('div');
  container.className = 'drone-container';
  document.body.appendChild(container);
  
  // ドローンの情報を格納する配列
  const drones = [];
  
  // ドローンのデフォルトサイズ
  const defaultWidth = 140;
  const defaultHeight = 140;
  // 衝突判定用のサイズ
  const collisionRadius = 100 / 2; // ドローンの実際のサイズに合わせる
  
  // 各ドローンを作成（重ならないように配置）
  for (let i = 0; i < droneCount; i++) {
    // ドローン画像を作成
    const drone = document.createElement('img');
    drone.src = '/images/drone.png';
    drone.className = 'bouncing-drone';
    drone.style.opacity = '0.4'; // ドローンを薄く表示（60%の不透明度）
    container.appendChild(drone);
    
    // 初期位置を設定（他のドローンと重ならないように）
    let x, y;
    let validPosition = false;
    let attempts = 0;
    const maxAttempts = 100; // 最大試行回数
    
    while (!validPosition && attempts < maxAttempts) {
      x = Math.random() * (window.innerWidth - defaultWidth);
      y = Math.random() * (window.innerHeight - defaultHeight);
      
      // 他のドローンとの距離をチェック
      validPosition = true;
      for (let j = 0; j < drones.length; j++) {
        const otherDrone = drones[j];
        const dx = (x + defaultWidth/2) - (otherDrone.x + otherDrone.width/2);
        const dy = (y + defaultHeight/2) - (otherDrone.y + otherDrone.height/2);
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // 最低距離（衝突半径の2倍）を確保
        if (distance < collisionRadius * 2) {
          validPosition = false;
          break;
        }
      }
      
      attempts++;
    }
    
    // 最大試行回数を超えた場合はランダムな位置に配置
    if (attempts >= maxAttempts) {
      x = Math.random() * (window.innerWidth - defaultWidth);
      y = Math.random() * (window.innerHeight - defaultHeight);
    }
    
    // 速度設定（speedFactorで調整可能）
    const baseSpeed = 0.5 + Math.random() * 0.5; // 基本速度
    const adjustedSpeed = baseSpeed * speedFactor; // 調整後の速度
    
    // ドローン情報オブジェクト
    const droneInfo = {
      element: drone,
      x: x,
      y: y,
      dx: adjustedSpeed * (Math.random() > 0.5 ? 1 : -1), // ランダムな方向
      dy: adjustedSpeed * (Math.random() > 0.5 ? 1 : -1), // ランダムな方向
      width: defaultWidth,
      height: defaultHeight,
      lastCollision: 0 // 最後に衝突した時間（連続衝突防止用）
    };
    
    // 配列に追加
    drones.push(droneInfo);
  }
  
  // 2つのドローン間の衝突を検出する関数
  function checkCollision(drone1, drone2, currentTime) {
    // 連続衝突防止（前回の衝突から500ms以内は無視）
    if (currentTime - drone1.lastCollision < 500 || currentTime - drone2.lastCollision < 500) {
      return false;
    }
    
    // ドローンの中心座標
    const center1 = {
      x: drone1.x + drone1.width / 2,
      y: drone1.y + drone1.height / 2
    };
    
    const center2 = {
      x: drone2.x + drone2.width / 2,
      y: drone2.y + drone2.height / 2
    };
    
    // 中心間の距離を計算
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 衝突判定（中心間の距離が衝突半径の2倍以下なら衝突）
    return distance < collisionRadius * 2;
  }
  
  // 衝突時の処理（シンプルな反発）
  function resolveCollision(drone1, drone2, currentTime) {
    // 衝突時刻を記録
    drone1.lastCollision = currentTime;
    drone2.lastCollision = currentTime;
    
    // ドローンの中心座標
    const center1 = {
      x: drone1.x + drone1.width / 2,
      y: drone1.y + drone1.height / 2
    };
    
    const center2 = {
      x: drone2.x + drone2.width / 2,
      y: drone2.y + drone2.height / 2
    };
    
    // 中心間のベクトル
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 正規化
    const nx = dx / distance;
    const ny = dy / distance;
    
    // 単純な速度反転（より確実な方法）
    const speed1 = Math.sqrt(drone1.dx * drone1.dx + drone1.dy * drone1.dy);
    const speed2 = Math.sqrt(drone2.dx * drone2.dx + drone2.dy * drone2.dy);
    
    // 新しい方向を計算
    const angle1 = Math.atan2(-ny, -nx);
    const angle2 = Math.atan2(ny, nx);
    
    // 新しい速度を設定
    drone1.dx = Math.cos(angle1) * speed1;
    drone1.dy = Math.sin(angle1) * speed1;
    drone2.dx = Math.cos(angle2) * speed2;
    drone2.dy = Math.sin(angle2) * speed2;
    
    // めり込み防止（強制的に離す）
    const minDistance = collisionRadius * 2;
    const overlap = minDistance - distance;
    
    if (overlap > 0) {
      // 完全に重なりを解消
      const separationX = nx * overlap * 0.6; // 60%で確実に分離
      const separationY = ny * overlap * 0.6;
      
      drone1.x -= separationX;
      drone1.y -= separationY;
      drone2.x += separationX;
      drone2.y += separationY;
    }
  }
  
  // アニメーションループ
  function animate(timestamp) {
    // 各ドローンを更新
    for (let i = 0; i < drones.length; i++) {
      const drone = drones[i];
      
      // 位置の更新
      drone.x += drone.dx;
      drone.y += drone.dy;
      
      // 画面端での跳ね返り
      if (drone.x + drone.width > window.innerWidth || drone.x < 0) {
        drone.dx = -drone.dx;
        // 左端または右端に到達した場合、位置を調整
        if (drone.x < 0) drone.x = 0;
        if (drone.x + drone.width > window.innerWidth) drone.x = window.innerWidth - drone.width;
      }
      if (drone.y + drone.height > window.innerHeight || drone.y < 0) {
        drone.dy = -drone.dy;
        // 上端または下端に到達した場合、位置を調整
        if (drone.y < 0) drone.y = 0;
        if (drone.y + drone.height > window.innerHeight) drone.y = window.innerHeight - drone.height;
      }
      
      // ドローンの位置を設定
      drone.element.style.left = drone.x + 'px';
      drone.element.style.top = drone.y + 'px';
      
      // ドローンの向きを速度に合わせて調整
      if (drone.dx > 0) {
        drone.element.style.transform = 'scaleX(1)'; // 右向き
      } else {
        drone.element.style.transform = 'scaleX(-1)'; // 左向き
      }
    }
    
    // ドローン同士の衝突検出と処理
    for (let i = 0; i < drones.length; i++) {
      for (let j = i + 1; j < drones.length; j++) {
        if (checkCollision(drones[i], drones[j], timestamp)) {
          resolveCollision(drones[i], drones[j], timestamp);
        }
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  // ウィンドウのリサイズ時にも対応
  window.addEventListener('resize', function() {
    // 各ドローンの位置を調整
    for (let i = 0; i < drones.length; i++) {
      const drone = drones[i];
      // 画面外にドローンがある場合は位置を調整
      if (drone.x + drone.width > window.innerWidth) drone.x = window.innerWidth - drone.width;
      if (drone.y + drone.height > window.innerHeight) drone.y = window.innerHeight - drone.height;
    }
  });
  
  // アニメーション開始
  requestAnimationFrame(animate);
});
