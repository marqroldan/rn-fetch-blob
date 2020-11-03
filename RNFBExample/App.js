import React from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  PermissionsAndroid,
} from 'react-native';
import Styles from './styles';
import RNFetchBlob from 'rn-fetch-blob';
const FileSystem = RNFetchBlob.fs;
const {
  dirs: {DocumentDir, DownloadDir},
} = FileSystem;

export default class App extends React.Component {
  state = {
    downloading: null,
    successful: null,
    readPermission: null,
    writePermission: null,
  };

  fileDetailsCreator = () => {
    const fileName = '_dummy.pdf';
    const downloadFolderPath = `${DownloadDir}/Now Serving`;
    const downloadFolderFilePath = `${downloadFolderPath}/${fileName}`;
    const downloadCacheFilePath = `${DocumentDir}/${fileName}`;
    return {
      fileName,
      downloadFolderPath,
      downloadFolderFilePath,
      downloadCacheFilePath,
    };
  };

  fileDetails = this.fileDetailsCreator();

  checkPermission = () => {
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    )
      .then((value) => {
        this.setState({
          readPermission: value,
        });
      })
      .catch((reason) => {
        console.error('Permission Check', reason);
      });
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    )
      .then((value) => {
        this.setState({
          writePermission: value,
        });
      })
      .catch((reason) => {
        console.error('Permission Check', reason);
      });
  };

  requestPermission = () => {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    ])
      .then((data) => {
        this.setState({
          readPermission:
            data[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE],
          writePermission:
            data[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE],
        });
      })
      .catch((reason) => {
        console.error('Request Permission', reason);
      });
  };

  componentDidMount() {
    this.checkPermission();
  }

  task = {};
  componentWillUnmount() {
    if (this.task?.cancel) {
      this.task.cancel();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.readPermission !== this.state.readPermission ||
      prevState.writePermission !== this.state.writePermission
    ) {
      this.fileDetails = this.fileDetailsCreator();
    }
  }

  downloadFile = () => {
    this.setState(
      {
        downloading: true,
      },
      () => {
        const {
          fileName,
          downloadFolderPath,
          downloadFolderFilePath,
          downloadCacheFilePath,
        } = this.fileDetails;
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
        <View style={Styles.group}>
          <Text style={{fontWeight: 'bold'}}>File Details</Text>
          {Object.keys(this.fileDetails).map((item) => (
            <Text>
              <Text style={{fontWeight: 'bold', color: 'green'}}>{item}:</Text>{' '}
              {JSON.stringify(this.fileDetails[item])}
            </Text>
          ))}
        </View>
        <View style={Styles.group}>
          <Text>
            Read Permission: {JSON.stringify(this.state.readPermission)}
          </Text>
          <Text>
            Write Permission: {JSON.stringify(this.state.writePermission)}
          </Text>
          <TouchableOpacity
            onPress={this.requestPermission}
            style={Styles.button}>
            <Text>Request Permissions</Text>
          </TouchableOpacity>
        </View>
        <Text>Downloading: {JSON.stringify(this.state.downloading)}</Text>
        <Text>Successful: {JSON.stringify(this.state.successful)}</Text>
        <TouchableOpacity onPress={this.downloadFile} style={Styles.button}>
          <Text>Press to download sample PDF file</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}
