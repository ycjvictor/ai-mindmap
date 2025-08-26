// 详细检查当前显示的所有SVG图标
console.log('=== 开始详细检查SVG图标 ===');

// 获取所有SVG元素
var svgElements = document.querySelectorAll('svg *');
console.log('总SVG元素数量:', svgElements.length);

// 分类统计
var elementTypes = {};
var circleElements = [];
var pathElements = [];
var rectElements = [];

svgElements.forEach(function(element, index) {
    var tagName = element.tagName.toLowerCase();
    elementTypes[tagName] = (elementTypes[tagName] || 0) + 1;
    
    // 检查圆形元素
    if (tagName === 'circle') {
        var fill = element.getAttribute('fill') || element.style.fill || '';
        var stroke = element.getAttribute('stroke') || element.style.stroke || '';
        var r = element.getAttribute('r') || '';
        
        if (fill || stroke) {
            circleElements.push({
                index: index,
                fill: fill,
                stroke: stroke,
                r: r,
                element: element
            });
        }
    }
    
    // 检查路径元素
    if (tagName === 'path') {
        var fill = element.getAttribute('fill') || element.style.fill || '';
        var stroke = element.getAttribute('stroke') || element.style.stroke || '';
        
        if (fill || stroke) {
            pathElements.push({
                index: index,
                fill: fill,
                stroke: stroke,
                element: element
            });
        }
    }
});

console.log('元素类型统计:', elementTypes);
console.log('\n=== 圆形元素详情 ===');
circleElements.forEach(function(circle, i) {
    console.log(`圆形 ${i+1}:`, circle);
});

console.log('\n=== 路径元素详情 ===');
pathElements.forEach(function(path, i) {
    console.log(`路径 ${i+1}:`, path);
});

// 尝试隐藏蓝色圆形图标
console.log('\n=== 尝试隐藏蓝色圆形图标 ===');
circleElements.forEach(function(circle, i) {
    var fill = circle.fill.toLowerCase();
    var stroke = circle.stroke.toLowerCase();
    
    // 检查是否是蓝色系
    if (fill.includes('blue') || fill.includes('#') || stroke.includes('blue') || stroke.includes('#')) {
        console.log(`发现可能的蓝色圆形 ${i+1}:`, fill, stroke);
        
        // 尝试隐藏
        circle.element.style.display = 'none';
        circle.element.style.opacity = '0';
        circle.element.style.visibility = 'hidden';
        
        console.log(`已尝试隐藏圆形 ${i+1}`);
    }
});

console.log('=== 检查完成 ===');
