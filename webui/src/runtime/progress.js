define(function (require, exports, module) {

    function ProgressRuntime() {
        var minder = this.minder;
        var hotbox = this.hotbox;
        var lang = this.lang.t;

        var main = hotbox.state('main');

        main.button({
            position: 'top',
            label: lang('main', 'runtime/progress'),
            key: 'G',
            next: 'progress',
            enable: function () {
                return minder.queryCommandState('progress') != -1;
            }
        });

        var progress = hotbox.state('progress');
        // 修正按钮映射：与工具栏按钮一致
        progress.button({
            position: 'ring',
            label: '✓',  // ✓ 按钮显示绿色对勾
            key: '1',
            action: function () {
                minder.execCommand('Progress', 1); // 对勾状态 - 绿色✓
            }
        });
        
        progress.button({
            position: 'ring', 
            label: '?',  // ? 按钮显示蓝色问号
            key: '2',
            action: function () {
                minder.execCommand('Progress', 2); // 问题状态 - 蓝色?
            }
        });
        
        progress.button({
            position: 'ring',
            label: '=',  // = 按钮显示橙色双竖线
            key: '3',
            action: function () {
                minder.execCommand('Progress', 3); // 暂停状态 - 橙色||
            }
        });

        progress.button({
            position: 'center',
            label: lang('remove', 'runtime/progress'),
            key: 'Del',
            action: function () {
                minder.execCommand('Progress', 0);
            }
        });

        progress.button({
            position: 'top',
            label: lang('esc', 'runtime/progress'),
            key: 'esc',
            next: 'back'
        });

        // 存储节点和图标的映射关系
        var nodeIconMap = new Map();
        var processingNodes = new Set(); // 防止重复处理
        
        // 创建自定义进度图标的函数
        function createProgressIcon(node) {
            try {
                var progress = node.getData('progress');
                if (!progress || progress <= 0) {
                    return null;
                }
                
                console.log('Creating custom progress icon - Level:', progress, 'for node:', node.getText());
                
                // 获取节点唯一标识符（兼容不同的KityMinder版本）
                var nodeId = node.id || node.data.id || node.uuid || (Math.random().toString(36).substr(2, 9));
                
                // 创建图标组，使用唯一ID
                var iconGroup = new kity.Group();
                var iconId = 'custom-progress-icon-' + nodeId;
                iconGroup.setId(iconId);
                
                // 不使用圆形背景，直接显示图标内容
                
                // 创建工具栏风格的图标
                switch(progress) {
                    case 1:
                        console.log('Creating CHECKMARK icon (level 1)');
                        // 绿色对勾图标 - 仿工具栏样式
                        var bgCircle = new kity.Circle(10);
                        bgCircle.fill('#28a745');
                        bgCircle.stroke('#1e7e34', 1);
                        iconGroup.addShape(bgCircle);
                        
                        var checkText = new kity.Text();
                        checkText.setContent('✓');
                        checkText.setTextAnchor('middle');
                        checkText.setX(0);
                        checkText.setY(0);
                        checkText.setFont({
                            size: 14,
                            family: 'Arial, sans-serif',
                            weight: 'bold'
                        });
                        checkText.fill('#ffffff');
                        // 设置垂直居中
                        checkText.setAttr('dominant-baseline', 'central');
                        iconGroup.addShape(checkText);
                        break;
                        
                    case 2:
                        console.log('Creating QUESTION icon (level 2)');
                        // 蓝色问号图标 - 仿工具栏样式
                        var questionBg = new kity.Circle(10);
                        questionBg.fill('#007bff');
                        questionBg.stroke('#0056b3', 1);
                        iconGroup.addShape(questionBg);
                        
                        var questionText = new kity.Text();
                        questionText.setContent('?');
                        questionText.setTextAnchor('middle');
                        questionText.setX(0);
                        questionText.setY(0);
                        questionText.setFont({
                            size: 14,
                            family: 'Arial, sans-serif',
                            weight: 'bold'
                        });
                        questionText.fill('#ffffff');
                        // 设置垂直居中
                        questionText.setAttr('dominant-baseline', 'central');
                        iconGroup.addShape(questionText);
                        break;
                        
                    case 3:
                        console.log('Creating PAUSE icon (level 3)');
                        // 暂停图标 - 仿工具栏样式
                        var pauseBg = new kity.Circle(10);
                        pauseBg.fill('#ffc107');
                        pauseBg.stroke('#e0a800', 1);
                        iconGroup.addShape(pauseBg);
                        
                        // 创建暂停图标（双竖线）
                        // 左竖线
                        var leftLine = new kity.Rect(2.5, 10);
                        leftLine.fill('#ffffff');
                        leftLine.translate(-4, -5);
                        iconGroup.addShape(leftLine);
                        
                        // 右竖线
                        var rightLine = new kity.Rect(2.5, 10);
                        rightLine.fill('#ffffff');
                        rightLine.translate(1.5, -5);
                        iconGroup.addShape(rightLine);
                        break;
                        
                    default:
                        console.log('Unknown progress level:', progress);
                        break;
                }
                
                console.log('Icon created with visual enhancements for level:', progress);
                return iconGroup;
            } catch (e) {
                console.log('Error creating progress icon:', e);
                return null;
            }
        }
        
        // 为节点生成唯一标识符
        function getNodeId(node) {
            try {
                // 使用节点在树中的路径作为唯一标识
                var path = [];
                var current = node;
                while (current) {
                    var parent = current.parent;
                    if (parent) {
                        var siblings = parent.children;
                        var index = siblings.indexOf(current);
                        path.unshift(index);
                    }
                    current = parent;
                }
                return path.join('-') + '-' + (node.getText() || 'untitled');
            } catch (e) {
                return 'node-' + Math.random().toString(36).substr(2, 9);
            }
        }
        
        // 为所有节点添加自定义进度图标
        function addProgressIcons() {
            try {
                console.log('=== Starting addProgressIcons ===');
                var processedCount = 0;
                var createdCount = 0;
                
                // 先检查是否有根节点
                var root = minder.getRoot();
                if (!root) {
                    console.log('没有找到根节点');
                    return;
                }
                
                root.traverse(function(node) {
                    try {
                        var progress = node.getData('progress');
                        var nodeId = getNodeId(node);
                        processedCount++;
                        
                        // 检查是否已经在处理中
                        if (processingNodes.has(nodeId)) {
                            console.log('Node already being processed:', nodeId);
                            return;
                        }
                        
                        // 移除已存在的自定义进度图标
                        var existingIcon = nodeIconMap.get(nodeId);
                        if (existingIcon) {
                            try {
                                existingIcon.remove();
                                console.log('Removed existing icon for node:', nodeId);
                            } catch (e) {
                                console.log('Error removing existing icon:', e);
                            }
                            nodeIconMap.delete(nodeId);
                        }
                        
                        if (progress && progress > 0) {
                            processingNodes.add(nodeId);
                            
                            var nodeContainer = node.getRenderContainer();
                            if (!nodeContainer) {
                                processingNodes.delete(nodeId);
                                return;
                            }
                            
                            // 创建新的进度图标
                            var icon = createProgressIcon(node);
                            if (icon) {
                                                            // 获取节点的边界框和渲染容器来计算正确位置
                            var nodeBox = node.getRenderBox();
                            if (nodeBox) {
                                // 将图标放在节点左侧外部，调整位置
                                var iconX = -19; // 再向右调整2像素
                                var iconY = -1;  // 向下调整3像素
                                
                                // 设置图标位置（相对定位）
                                icon.translate(iconX, iconY);
                                
                                // 确保图标可见性
                                icon.setVisible(true);
                                
                                // 添加到节点容器
                                nodeContainer.addShape(icon);
                                
                                console.log('Icon positioned at offset:', iconX, iconY);
                                
                                // 确保图标在最顶层（使用Kity的方法）
                                try {
                                    if (icon.bringTop) {
                                        icon.bringTop();
                                    } else if (nodeContainer.bringShapeToFront) {
                                        nodeContainer.bringShapeToFront(icon);
                                    }
                                } catch (e) {
                                    console.log('无法调整图标层级:', e);
                                }
                                
                                // 强制移除可能存在的原始进度图标
                                setTimeout(function() {
                                    hideOriginalProgressIcons(nodeContainer);
                                }, 50);
                                
                                // 存储映射关系
                                nodeIconMap.set(nodeId, icon);
                                createdCount++;
                                
                                console.log('Successfully created icon for node:', nodeId, 'progress:', progress);
                            }
                            }
                            
                            processingNodes.delete(nodeId);
                        }
                    } catch (e) {
                        console.log('Error processing node:', e);
                        processingNodes.delete(nodeId);
                    }
                });
                
                console.log('=== Finished addProgressIcons ===');
                console.log('Processed nodes:', processedCount, 'Created icons:', createdCount);
                console.log('Total icons in map:', nodeIconMap.size);
                
            } catch (e) {
                console.log('Error in addProgressIcons:', e);
            }
        }

        // 防抖函数，避免频繁调用
        var addProgressIconsDebounced = (function() {
            var timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(addProgressIcons, 100);
            };
        })();

        // 隐藏原始进度图标的函数
        function hideOriginalProgressIcons(container) {
            try {
                var shapes = container.getShapes();
                shapes.forEach(function(shape) {
                    try {
                        // 检查shape的类型和属性
                        var shapeName = '';
                        var fillColor = '';
                        var strokeColor = '';
                        
                        // 获取shape类型
                        if (shape.node && shape.node.nodeName) {
                            shapeName = shape.node.nodeName.toLowerCase();
                        } else if (shape.type) {
                            shapeName = shape.type.toLowerCase();
                        }
                        
                        // 安全地获取填充颜色
                        if (typeof shape.getFill === 'function') {
                            var fill = shape.getFill();
                            if (fill) {
                                fillColor = fill.toString();
                            }
                        } else if (shape.fill) {
                            fillColor = shape.fill.toString();
                        }
                        
                        // 安全地获取描边颜色
                        if (typeof shape.getStroke === 'function') {
                            var stroke = shape.getStroke();
                            if (stroke) {
                                strokeColor = stroke.toString();
                            }
                        } else if (shape.stroke) {
                            strokeColor = shape.stroke.toString();
                        }
                        
                        // 检查是否是原始进度图标
                        var isProgressIcon = false;
                        if (fillColor && (
                            fillColor.includes('#FFED83') ||
                            fillColor.includes('#43BC00') ||
                            fillColor.includes('#8E8E8E') ||
                            fillColor.includes('#ffed83') ||
                            fillColor.includes('#43bc00') ||
                            fillColor.includes('#8e8e8e')
                        )) {
                            isProgressIcon = true;
                        }
                        
                        if (strokeColor && (
                            strokeColor.includes('#FFED83') ||
                            strokeColor.includes('#43BC00') ||
                            strokeColor.includes('#8E8E8E')
                        )) {
                            isProgressIcon = true;
                        }
                        
                        // 隐藏原始进度图标
                        if (isProgressIcon) {
                            if (typeof shape.setVisible === 'function') {
                                shape.setVisible(false);
                            } else if (shape.node) {
                                shape.node.style.display = 'none';
                                shape.node.style.visibility = 'hidden';
                                shape.node.style.opacity = '0';
                            }
                            console.log('Hidden original progress icon:', shapeName, fillColor || strokeColor);
                        }
                        
                    } catch (shapeError) {
                        // 单个shape处理失败不影响其他shape
                        console.log('Error processing individual shape:', shapeError);
                    }
                });
            } catch (e) {
                console.log('Error hiding original icons:', e);
            }
        }

        // 监听内容变化来更新进度图标
        minder.on('contentchange', function() {
            console.log('Content change event fired');
            addProgressIconsDebounced();
        });
        
        // 监听布局完成事件
        minder.on('layoutallfinish', function() {
            console.log('Layout finish event fired');
            addProgressIconsDebounced();
        });
        
        // 初始化时添加进度图标
        setTimeout(function() {
            console.log('Initial progress icons setup');
            addProgressIcons();
        }, 300);
    }

    return module.exports = ProgressRuntime;

});