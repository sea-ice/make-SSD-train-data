module.exports = {
    datasetPath: './dataset/dishes',
    xmlSavePath: './xml/Annotations/dishes',
    folderName: 'dataset', // 配置xml文件中folder标签值
    size: {
        width: 1280,
        height: 1024,
        depth: 3
    },
    common: {
        imageWidth: 1280
    },
    // types: [{
    //     color: '#FFB6B9',
    //     name: 'liver'
    // }, {
    //     color: '#FF6138',
    //     name: 'stomach'
    // }, {
    //     color: '#BCFFA8',
    //     name: 'pancreas'
    // }, {
    //     color: '#D7EEF2',
    //     name: 'heart'
    // }, {
    //     color: '#248888',
    //     name: 'lung'
    // }]
    typesImgDir: './assets/images/sample/20180623',
    typeStrokeColor: '#FF6138'
}