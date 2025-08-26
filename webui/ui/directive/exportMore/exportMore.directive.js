angular.module('kityminderEditor')
  .directive('exportMore', function () {
    return {
      restrict: 'E',
      templateUrl: 'ui/directive/exportMore/exportMore.html',
      scope: {
        minder: '='
      },
      link: function ($scope, element, attrs) {
        // 确保模板内容被正确插入
        console.log('Export-more directive loaded:', element);
        
        // 添加点击事件处理
        element.on('click', 'li.export', function(e) {
          var type = $(this).attr('data-type');
          console.log('Export clicked:', type);
          
          if ($scope.minder) {
            // 使用现有的导出逻辑
            var exportType;
            switch (type) {
              case "km":
                exportType = "json";
                break;
              case "xmind":
                exportType = "json";
                break;
              case "md":
                exportType = "markdown";
                break;
              case "svg":
                exportType = "svg";
                break;
              case "txt":
                exportType = "text";
                break;
              case "png":
                exportType = "svg";
                break;
              default:
                exportType = type;
                break;
            }

            // 执行导出
            try {
              // 在浏览器环境中，检查是否为xmind格式
              if (!window.vscode && type === 'xmind') {
                alert('XMind格式导出需要在VSCode环境中使用。\n建议导出为JSON格式，然后使用XMind软件打开。');
                return;
              }

              window.editor.minder.exportData(exportType).then(function (content) {
                try {
                  if (window.vscode) {
                    // VSCode 环境 - 支持所有格式包括xmind
                    window.vscode.postMessage({
                      command: "export",
                      filename: $scope.minder.getRoot().getData('text') || '思维导图',
                      type: type,
                      content: content,
                    });
                  } else {
                    // 浏览器环境 - 只支持非xmind格式
                    var filename = ($scope.minder.getRoot().getData('text') || '思维导图') + '.' + type;
                    var mimeType = 'text/plain';
                    
                    // 根据文件类型设置MIME类型
                    switch (type) {
                      case 'json':
                        mimeType = 'application/json';
                        break;
                      case 'svg':
                        mimeType = 'image/svg+xml';
                        break;
                      case 'md':
                        mimeType = 'text/markdown';
                        break;
                      case 'png':
                        // PNG格式特殊处理
                        if (typeof content === 'string') {
                          if (content.startsWith('data:image/png')) {
                            // 如果是base64格式，直接下载
                            var a = document.createElement('a');
                            a.href = content;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            return;
                          } else if (content.indexOf('<svg') === 0) {
                            // SVG内容，需要提示用户
                            alert('PNG导出在浏览器中返回了SVG格式。\n建议导出SVG格式或在VSCode中使用PNG导出功能。');
                            return;
                          }
                        }
                        mimeType = 'image/png';
                        break;
                      default:
                        mimeType = 'text/plain';
                    }
                    
                    var blob = new Blob([content], {type: mimeType});
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }
                } catch (error) {
                  console.error('Export processing failed:', error);
                  alert('导出处理失败: ' + error.message);
                }
              });
            } catch (error) {
              console.error('Export failed:', error);
              alert('导出失败: ' + error.message);
            }
          }
        });
        
        element.on('click', 'li.import', function(e) {
          console.log('Import clicked');
          if (window.vscode) {
            // VSCode 环境，通知扩展打开文件选择对话框
            window.vscode.postMessage({
              command: "importFile",
            });
          } else {
            // 浏览器环境，创建文件输入
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.km,.xmind,.json,.md,.txt';
            input.onchange = function(event) {
              var file = event.target.files[0];
              if (file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                  try {
                    var content = e.target.result;
                    var fileType = "";
                    var ext = file.name.toLowerCase().split('.').pop();
                    
                    switch (ext) {
                      case "md":
                        fileType = "markdown";
                        break;
                      case "txt":
                        fileType = "text";
                        break;
                      case "km":
                      case "json":
                        fileType = "json";
                        break;
                      case "xmind":
                        fileType = "json";
                        break;
                      default:
                        fileType = "";
                        break;
                    }
                    
                    if (fileType) {
                      if (fileType === "json" && typeof content === "string") {
                        try {
                          content = JSON.parse(content);
                        } catch (parseError) {
                          console.error('JSON parse error:', parseError);
                          alert('文件格式不正确');
                          return;
                        }
                      }
                      
                      try {
                        window.editor.minder.importData(fileType, content).then(function() {
                          console.log('Import successful');
                        });
                      } catch (importError) {
                        console.error('Import failed:', importError);
                        alert('导入失败: ' + importError.message);
                      }
                    } else {
                      alert('不支持的文件格式');
                    }
                  } catch (error) {
                    console.error('File read error:', error);
                    alert('文件读取失败');
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          }
        });
      }
    }
  });
