# 3D 场景预留目录

这里用于后续放置五魔方 3D 建模相关代码。

建议后续按以下方向拆分：

- `MegaminxScene.tsx`：React Three Fiber 场景入口。
- `geometry/`：五魔方几何体、面片和块体数据。
- `controls/`：相机控制、层转动交互和动画状态。
- `materials/`：颜色、材质和高亮规则。

当前初始化阶段不包含具体五魔方模型实现。
