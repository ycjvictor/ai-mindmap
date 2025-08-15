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
        '0123'.replace(/./g, function (p) {
            progress.button({
                position: 'ring',
                label: 'G' + p,
                key: p,
                action: function () {
                    minder.execCommand('Progress', parseInt(p));
                }
            });
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
                
                // 创建图标组
                var iconGroup = new kity.Group();
                
                // 先添加阴影效果
                var shadow = new kity.Circle(15);
                shadow.fill('#00000020');
                shadow.translate(2, 2);
                iconGroup.addShape(shadow);
                
                // 创建更大的圆形背景，使用更明显的边框
                var circle = new kity.Circle(15);
                circle.fill('#ffffff');
                circle.stroke('#333333', 2);
                iconGroup.addShape(circle);
                
                // 创建内容形状，根据进度级别显示不同的图标
                switch(progress) {
                    case 1:
                        console.log('Creating PAUSE icon (level 1)');
                        // 暂停图标 - 两个明显的橙色竖线
                        var line1 = new kity.Rect(4, 16);
                        line1.fill('#ff6600');
                        line1.stroke('#ff6600', 1);
                        line1.translate(-6, -8);
                        iconGroup.addShape(line1);
                        
                        var line2 = new kity.Rect(4, 16);
                        line2.fill('#ff6600');
                        line2.stroke('#ff6600', 1);
                        line2.translate(2, -8);
                        iconGroup.addShape(line2);
                        
                        // 明显的橙色背景
                        circle.fill('#ffcc99');
                        circle.stroke('#ff6600', 2);
                        break;
                    case 2:
                        console.log('Creating QUESTION icon (level 2)');
                        // 问题图标 - 更大更明显的蓝色问号
                        var text = new kity.Text();
                        text.setContent('?');
                        text.setTextAnchor('middle');
                        text.setX(0);
                        text.setY(6);
                        text.setFont({
                            size: 18,
                            family: 'Arial, sans-serif',
                            weight: 'bold'
                        });
                        text.fill('#0066cc');
                        text.stroke('#0066cc', 1);
                        iconGroup.addShape(text);
                        
                        // 明显的蓝色背景
                        circle.fill('#cce6ff');
                        circle.stroke('#0066cc', 2);
                        break;
                    case 3:
                        console.log('Creating CHECKMARK icon (level 3)');
                        // 完成图标 - 更大更明显的绿色对勾
                        var checkText = new kity.Text();
                        checkText.setContent('✓');
                        checkText.setTextAnchor('middle');
                        checkText.setX(0);
                        checkText.setY(6);
                        checkText.setFont({
                            size: 20,
                            family: 'Arial, sans-serif',
                            weight: 'bold'
                        });
                        checkText.fill('#009900');
                        checkText.stroke('#009900', 1);
                        iconGroup.addShape(checkText);
                        
                        // 明显的绿色背景
                        circle.fill('#ccffcc');
                        circle.stroke('#009900', 2);
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
                
                minder.getRoot().traverse(function(node) {
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
                                // 获取节点的边界框来计算位置
                                var nodeBox = node.getRenderBox();
                                if (nodeBox) {
                                    var iconX = nodeBox.x + nodeBox.width + 15;
                                    var iconY = nodeBox.y + nodeBox.height / 2;
                                    
                                    // 设置图标位置
                                    icon.translate(iconX, iconY);
                                    
                                    // 添加到节点容器
                                    nodeContainer.addShape(icon);
                                    
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