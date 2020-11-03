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
    copy: null,
    readPermission: null,
    writePermission: null,
    downloadFolderExists: null,
  };

  fileDetailsCreator = () => {
    const fileName = '_dummy.pdf';
    const downloadFolderPath = `${DownloadDir}/Name With Space`;
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

  checkPermission = (callback = () => {}) => {
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    )
      .then((value) => {
        this.setState(
          {
            readPermission: value,
          },
          callback,
        );
      })
      .catch((reason) => {
        console.error('Permission Check', reason);
      });
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    )
      .then((value) => {
        this.setState(
          {
            writePermission: value,
          },
          callback,
        );
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
            data[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
            PermissionsAndroid.RESULTS.GRANTED,
          writePermission:
            data[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
            PermissionsAndroid.RESULTS.GRANTED,
        });
      })
      .catch((reason) => {
        console.error('Request Permission', reason);
      });
  };

  createDirectories = async () => {
    if (this.state.writePermission && this.state.readPermission) {
      const dir = this.fileDetails.downloadFolderPath;
      const isDir = await FileSystem.isDir(dir);
      if (!isDir) {
        try {
          await FileSystem.mkdir(dir);
          this.setState({
            downloadFolderExists: true,
          });
        } catch (err) {
          console.error('FileSystem MKDIR', err);
          this.setState({
            downloadFolderExists: false,
          });
        }
      } else {
        this.setState({
          downloadFolderExists: true,
        });
      }
    }
  };

  componentDidMount() {
    this.checkPermission(this.createDirectories);
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
      this.createDirectories();
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
            .then(() => {
              this.setState({
                copy: true,
              });
            })
            .catch((err) => {
              console.error('FileSystem Copy', err);
              this.setState({
                copy: false,
              });
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
            Download Folder Exists:{' '}
            {JSON.stringify(this.state.downloadFolderExists)}
          </Text>
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
        <Text>Copy to Downloads: {JSON.stringify(this.state.copy)}</Text>
        <TouchableOpacity onPress={this.downloadFile} style={Styles.button}>
          <Text>Press to download sample PDF file</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}
