import React from 'react';
import {ScrollView, View, TouchableOpacity, Text} from 'react-native';
import Styles from './styles';
import RNFetchBlob from 'rn-fetch-blob';
const FileSystem = RNFetchBlob.fs;
const {DocumentDir, DownloadDir} = FileSystem;

export default class App extends React.Component {
  state = {
    downloading: null,
    successful: null,
  };

  task = {};
  componentWillUnmount() {
    if (this.task?.cancel) {
      this.task.cancel();
    }
  }

  downloadFile = () => {
    this.setState(
      {
        downloading: true,
      },
      () => {
        const fileName = '_dummy.pdf';
        const downloadFolderPath = `${DownloadDir}/Now Serving`;
        const downloadFolderFilePath = `${downloadFolderPath}/${fileName}`;
        const downloadCacheFilePath = `${DocumentDir}/${fileName}`;
        this.task = RNFetchBlob.config({
          fileCache: true,
          path: downloadCacheFilePath,
          appendExt: 'pdf',
        }).fetch(
          'GET',
          'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        );
        this.task.then(() => {
          this.setState({
            downloading: false,
            successful: true,
          });
          FileSystem.cp(downloadCacheFilePath, downloadFolderFilePath)
            .then(() => {})
            .catch((err) => {
              console.error('FileSystem Copy', err);
            });
        });
        this.task.catch((err) => {
          this.setState({
            downloading: false,
            successful: false,
          });
          console.error('Download Task', err);
        });
      },
    );
  };

  render() {
    return (
      <ScrollView
        style={Styles.scrollViewStyle}
        contentContainerStyle={Styles.scrollViewContentStyle}>
        <Text>Downloading: {JSON.stringify(this.state.downloading)}</Text>
        <Text>Successful: {JSON.stringify(this.state.successful)}</Text>
        <TouchableOpacity onPress={this.downloadFile} style={Styles.button}>
          <Text>Press to download sample PDF file</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}
